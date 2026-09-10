// Package orders creates customer orders: validation, server-side pricing,
// schedule checks, persistence and the WhatsApp hand-off.
package orders

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/hours"
	"merenda/backend/internal/service/settings"
)

// Service is the orders use-case layer.
type Service struct {
	repos    *repo.Repos
	settings *settings.Service
	now      func() time.Time
}

// New creates the service.
func New(repos *repo.Repos, settings *settings.Service) *Service {
	return &Service{repos: repos, settings: settings, now: time.Now}
}

const (
	maxLines      = 50
	maxQuantity   = 99
	maxNameLen    = 100
	maxPhoneLen   = 40
	maxCommentLen = 500
)

// line is one merged order line (duplicate product ids are summed).
type line struct {
	productID string
	quantity  int
}

// Create validates the request, re-prices it from the database, checks the order
// settings and schedules, stores the order and builds the WhatsApp message.
func (s *Service) Create(ctx context.Context, req domain.CreateOrderRequest) (domain.CreateOrderResponse, error) {
	f := domain.Fields{}
	if !domain.ValidOrderType(req.Type) {
		f.Add("type", "Выберите тип заказа: в заведении или на вынос")
	}
	name := strings.TrimSpace(req.CustomerName)
	if len([]rune(name)) > maxNameLen {
		f.Add("customerName", "Слишком длинное имя")
	}
	phone := strings.TrimSpace(req.CustomerPhone)
	if phone != "" {
		digits, ok := settings.NormalizePhoneDigits(phone)
		if !ok || len(digits) < 7 || len(digits) > 15 || len(phone) > maxPhoneLen {
			f.Add("customerPhone", "Укажите корректный номер телефона")
		}
	}
	comment := strings.TrimSpace(req.Comment)
	if len([]rune(comment)) > maxCommentLen {
		f.Add("comment", "Слишком длинный комментарий")
	}
	lines := mergeLines(f, req.Items)
	if err := f.Err(); err != nil {
		return domain.CreateOrderResponse{}, err
	}

	sm, err := s.settings.Load(ctx)
	if err != nil {
		return domain.CreateOrderResponse{}, err
	}
	if !sm.Orders.Enabled {
		return domain.CreateOrderResponse{}, &domain.ValidationError{Message: "Приём заказов на сайте сейчас отключён"}
	}
	if req.Type == domain.OrderDineIn && !sm.Orders.AllowDineIn {
		return domain.CreateOrderResponse{}, domain.NewValidation("type", "Заказы в заведении сейчас не принимаются")
	}
	if req.Type == domain.OrderTakeaway && !sm.Orders.AllowTakeaway {
		return domain.CreateOrderResponse{}, domain.NewValidation("type", "Заказы на вынос сейчас не принимаются")
	}

	items, subtotal, menuSchedules, err := s.priceLines(ctx, lines)
	if err != nil {
		return domain.CreateOrderResponse{}, err
	}
	if min := sm.Orders.MinOrderMinor; min > 0 && subtotal < min {
		return domain.CreateOrderResponse{}, &domain.ValidationError{
			Message: "Минимальная сумма заказа — " + FormatMoney(min, sm.Business.Currency),
			Fields:  map[string]string{"items": "Добавьте блюд ещё на " + FormatMoney(min-subtotal, sm.Business.Currency)},
		}
	}
	if sm.Orders.BlockWhenClosed {
		if err := s.checkOpen(ctx, sm, menuSchedules); err != nil {
			return domain.CreateOrderResponse{}, err
		}
	}

	order := domain.Order{
		Type: req.Type, Status: domain.OrderNew,
		CustomerName: name, CustomerPhone: phone, Comment: comment,
		SubtotalMinor: subtotal, TotalMinor: subtotal, Items: items,
	}
	err = s.repos.Tx(ctx, func(ctx context.Context, tx pgx.Tx) error {
		r := s.repos.Orders.WithTx(tx)
		created, err := r.Create(ctx, order)
		if err != nil {
			return err
		}
		saved, err := r.AddItems(ctx, created.ID, items)
		if err != nil {
			return err
		}
		created.Items = saved
		created.WhatsappMessage = BuildMessage(sm.Orders, sm.Business.Currency, created)
		if err := r.UpdateMessage(ctx, created.ID, created.WhatsappMessage); err != nil {
			return err
		}
		order = created
		return nil
	})
	if err != nil {
		return domain.CreateOrderResponse{}, err
	}

	resp := domain.CreateOrderResponse{Order: order, Message: order.WhatsappMessage}
	if digits, ok := settings.NormalizePhoneDigits(sm.Orders.WhatsappNumber); ok && digits != "" {
		link := WhatsappURL(digits, order.WhatsappMessage)
		resp.WhatsappURL = &link
	}
	return resp, nil
}

// mergeLines validates the items and sums duplicate product ids, keeping first-seen order.
func mergeLines(f domain.Fields, items []domain.CreateOrderItem) []line {
	if len(items) == 0 {
		f.Add("items", "Добавьте хотя бы одно блюдо")
		return nil
	}
	if len(items) > maxLines {
		f.Add("items", fmt.Sprintf("Не более %d позиций в заказе", maxLines))
		return nil
	}
	index := map[string]int{}
	var out []line
	for _, it := range items {
		id := strings.TrimSpace(it.ProductID)
		if !domain.IsUUID(id) {
			f.Add("items", "Некорректный идентификатор блюда")
			continue
		}
		if it.Quantity < 1 || it.Quantity > maxQuantity {
			f.Add("items", fmt.Sprintf("Количество должно быть от 1 до %d", maxQuantity))
			continue
		}
		if i, ok := index[id]; ok {
			out[i].quantity += it.Quantity
			if out[i].quantity > maxQuantity {
				f.Add("items", fmt.Sprintf("Количество должно быть от 1 до %d", maxQuantity))
			}
			continue
		}
		index[id] = len(out)
		out = append(out, line{productID: id, quantity: it.Quantity})
	}
	return out
}

// priceLines loads the products and builds priced item snapshots. It reports
// unknown, hidden, unavailable or inactive-menu products on `items`.
func (s *Service) priceLines(ctx context.Context, lines []line) ([]domain.OrderItem, int64, map[string]*string, error) {
	ids := make([]string, 0, len(lines))
	for _, l := range lines {
		ids = append(ids, l.productID)
	}
	products, err := s.repos.Products.ForOrder(ctx, ids)
	if err != nil {
		return nil, 0, nil, err
	}
	items := make([]domain.OrderItem, 0, len(lines))
	menuSchedules := map[string]*string{}
	var subtotal int64
	var unavailable []string
	unknown := 0
	for _, l := range lines {
		p, ok := products[l.productID]
		switch {
		case !ok:
			unknown++
			continue
		case p.Availability != domain.Available || !p.MenuActive || !p.CategoryActive:
			unavailable = append(unavailable, p.Name)
			continue
		}
		id := p.ID
		total := p.PriceMinor * int64(l.quantity)
		items = append(items, domain.OrderItem{ProductID: &id, Name: p.Name, PriceMinor: p.PriceMinor, Quantity: l.quantity, TotalMinor: total})
		subtotal += total
		menuSchedules[p.MenuID] = p.ScheduleID
	}
	if len(unavailable) > 0 || unknown > 0 {
		detail := "Обновите страницу и соберите заказ заново"
		if len(unavailable) > 0 {
			detail = "Уберите из корзины: " + strings.Join(unavailable, ", ")
		}
		return nil, 0, nil, &domain.ValidationError{Message: "Некоторые блюда сейчас недоступны.", Fields: map[string]string{"items": detail}}
	}
	return items, subtotal, menuSchedules, nil
}

// checkOpen enforces blockWhenClosed: the venue must be open and every menu with
// its own schedule (kitchen, bar …) must be open too.
func (s *Service) checkOpen(ctx context.Context, sm domain.SettingsMap, menuSchedules map[string]*string) error {
	schedules, err := s.repos.Schedules.List(ctx)
	if err != nil {
		return err
	}
	now := s.now()
	status := hours.Compute(hours.Input{Schedules: schedules, Status: sm.Status, Timezone: sm.Business.Timezone, Now: now})
	if !status.Venue.IsOpen {
		msg := "Заведение сейчас закрыто"
		switch {
		case status.Venue.Mode == domain.ModeTemporarilyClosed && sm.Status.Message != "":
			msg += ": " + sm.Status.Message
		case status.Venue.Message != "":
			msg += ". " + status.Venue.Message
		}
		return &domain.ValidationError{Message: msg, Fields: map[string]string{"items": "Заказы принимаются только в часы работы"}}
	}
	byID := make(map[string]domain.Schedule, len(schedules))
	for _, sch := range schedules {
		byID[sch.ID] = sch
	}
	statusByID := make(map[string]domain.ScheduleStatus, len(status.Schedules))
	for _, st := range status.Schedules {
		statusByID[st.ScheduleID] = st
	}
	for _, scheduleID := range menuSchedules {
		if scheduleID == nil {
			continue
		}
		sch, ok := byID[*scheduleID]
		if !ok || sch.Kind == domain.ScheduleVenue {
			continue
		}
		if !hours.IsScheduleOpen(sch, now, sm.Business.Timezone) {
			detail := "Заказы принимаются только в часы работы"
			if st, ok := statusByID[sch.ID]; ok && st.Message != "" {
				detail = st.Message
			}
			return &domain.ValidationError{Message: sch.Name + " сейчас не принимает заказы.", Fields: map[string]string{"items": detail}}
		}
	}
	return nil
}

// List returns a page of orders for the admin.
func (s *Service) List(ctx context.Context, q domain.OrderQuery) (domain.Paginated[domain.Order], error) {
	f := domain.Fields{}
	if q.Status != "" && !domain.ValidOrderStatus(domain.OrderStatus(q.Status)) {
		f.Add("status", "Допустимые значения: new, confirmed, completed, cancelled")
	}
	if q.Type != "" && !domain.ValidOrderType(domain.OrderType(q.Type)) {
		f.Add("type", "Допустимые значения: dine_in, takeaway")
	}
	if err := f.Err(); err != nil {
		return domain.Paginated[domain.Order]{}, err
	}
	return s.repos.Orders.List(ctx, q)
}

// Get loads one order.
func (s *Service) Get(ctx context.Context, id string) (domain.Order, error) {
	if !domain.IsUUID(id) {
		return domain.Order{}, domain.ErrNotFound
	}
	return s.repos.Orders.ByID(ctx, id)
}

// SetStatus changes the order status.
func (s *Service) SetStatus(ctx context.Context, id string, status domain.OrderStatus) (domain.Order, error) {
	if !domain.IsUUID(id) {
		return domain.Order{}, domain.ErrNotFound
	}
	if !domain.ValidOrderStatus(status) {
		return domain.Order{}, domain.NewValidation("status", "Допустимые значения: new, confirmed, completed, cancelled")
	}
	return s.repos.Orders.SetStatus(ctx, id, status)
}

// Delete removes an order.
func (s *Service) Delete(ctx context.Context, id string) error {
	if !domain.IsUUID(id) {
		return domain.ErrNotFound
	}
	return s.repos.Orders.Delete(ctx, id)
}
