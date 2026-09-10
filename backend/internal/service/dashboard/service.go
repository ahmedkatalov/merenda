// Package dashboard aggregates counters, status, warnings and recent orders for the admin home page.
package dashboard

import (
	"context"
	"time"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/auth"
	"merenda/backend/internal/service/settings"
	"merenda/backend/internal/service/site"
)

// Service builds DashboardStats.
type Service struct {
	repos    *repo.Repos
	settings *settings.Service
	site     *site.Service
	auth     *auth.Service
	now      func() time.Time
}

// New creates the service.
func New(repos *repo.Repos, settings *settings.Service, site *site.Service, auth *auth.Service) *Service {
	return &Service{repos: repos, settings: settings, site: site, auth: auth, now: time.Now}
}

const recentOrders = 5

// Warning texts shown on the dashboard.
const (
	msgDefaultPassword   = "Смените пароль администратора, заданный при установке — раздел «Безопасность»"
	msgWhatsappMissing   = "Укажите номер WhatsApp в разделе «WhatsApp / Заказы» — иначе заказы не будут отправляться"
	msgNoProducts        = "В меню пока нет ни одного блюда — добавьте позиции в разделе «Блюда»"
	msgTemporarilyClosed = "Заведение отмечено как временно закрытое — снимите отметку в разделе «Режим работы», когда откроетесь"
)

// Stats computes the dashboard payload.
func (s *Service) Stats(ctx context.Context) (domain.DashboardStats, error) {
	sm, err := s.settings.Load(ctx)
	if err != nil {
		return domain.DashboardStats{}, err
	}
	out := domain.DashboardStats{Warnings: []domain.DashboardWarning{}, RecentOrders: []domain.Order{}}

	if out.Products, err = s.repos.Products.Counts(ctx); err != nil {
		return out, err
	}
	if out.Categories, err = s.repos.Categories.Count(ctx); err != nil {
		return out, err
	}
	if out.Menus, err = s.repos.Menus.Count(ctx); err != nil {
		return out, err
	}
	if out.Media, err = s.repos.Media.Count(ctx); err != nil {
		return out, err
	}
	if out.Orders, err = s.repos.Orders.Counts(ctx, dayStart(s.now(), sm.Business.Timezone)); err != nil {
		return out, err
	}
	if out.Status, err = s.site.StatusFor(ctx, sm); err != nil {
		return out, err
	}
	if out.RecentOrders, err = s.repos.Orders.Recent(ctx, recentOrders); err != nil {
		return out, err
	}

	if s.auth != nil && s.auth.DefaultPasswordInUse() {
		out.Warnings = append(out.Warnings, domain.DashboardWarning{Code: "default_password", Message: msgDefaultPassword})
	}
	if sm.Orders.Enabled && sm.Orders.WhatsappNumber == "" {
		out.Warnings = append(out.Warnings, domain.DashboardWarning{Code: "whatsapp_missing", Message: msgWhatsappMissing})
	}
	if out.Products.Total == 0 {
		out.Warnings = append(out.Warnings, domain.DashboardWarning{Code: "no_products", Message: msgNoProducts})
	}
	if sm.Status.Mode == domain.ModeTemporarilyClosed {
		out.Warnings = append(out.Warnings, domain.DashboardWarning{Code: "temporarily_closed", Message: msgTemporarilyClosed})
	}
	return out, nil
}

// dayStart returns midnight of "today" in the business timezone.
func dayStart(now time.Time, timezone string) time.Time {
	loc, err := time.LoadLocation(timezone)
	if err != nil || timezone == "" {
		loc = time.UTC
	}
	local := now.In(loc)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, loc)
}
