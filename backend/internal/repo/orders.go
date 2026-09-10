package repo

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Orders persists customer orders and their item snapshots.
type Orders struct{ q Querier }

// WithTx binds the repository to a transaction.
func (r *Orders) WithTx(tx pgx.Tx) *Orders { return &Orders{q: tx} }

const orderCols = `id, number, type, status, customer_name, customer_phone, comment, subtotal_minor, total_minor, whatsapp_message, created_at, updated_at`

func scanOrder(row interface{ Scan(dest ...any) error }) (domain.Order, error) {
	var o domain.Order
	err := row.Scan(&o.ID, &o.Number, &o.Type, &o.Status, &o.CustomerName, &o.CustomerPhone, &o.Comment, &o.SubtotalMinor, &o.TotalMinor, &o.WhatsappMessage, &o.CreatedAt, &o.UpdatedAt)
	o.Items = []domain.OrderItem{}
	return o, err
}

// Create inserts the order header; items are added with AddItems. The number comes from the sequence.
func (r *Orders) Create(ctx context.Context, o domain.Order) (domain.Order, error) {
	row := r.q.QueryRow(ctx, `INSERT INTO orders (type, status, customer_name, customer_phone, comment, subtotal_minor, total_minor, whatsapp_message)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING `+orderCols,
		o.Type, o.Status, o.CustomerName, o.CustomerPhone, o.Comment, o.SubtotalMinor, o.TotalMinor, o.WhatsappMessage)
	out, err := scanOrder(row)
	return out, wrap("create order", err)
}

// AddItems inserts item snapshots in order and returns them with ids.
func (r *Orders) AddItems(ctx context.Context, orderID string, items []domain.OrderItem) ([]domain.OrderItem, error) {
	out := make([]domain.OrderItem, 0, len(items))
	for i, it := range items {
		var id string
		err := r.q.QueryRow(ctx, `INSERT INTO order_items (order_id, product_id, name, price_minor, quantity, total_minor, sort_order)
			VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
			orderID, it.ProductID, it.Name, it.PriceMinor, it.Quantity, it.TotalMinor, i).Scan(&id)
		if err != nil {
			return nil, wrap("add order item", err)
		}
		it.ID = id
		out = append(out, it)
	}
	return out, nil
}

// UpdateMessage stores the generated WhatsApp message (it embeds the order number).
func (r *Orders) UpdateMessage(ctx context.Context, id, message string) error {
	_, err := r.q.Exec(ctx, `UPDATE orders SET whatsapp_message = $2 WHERE id = $1`, id, message)
	return wrap("update order message", err)
}

// ByID loads an order with its items.
func (r *Orders) ByID(ctx context.Context, id string) (domain.Order, error) {
	o, err := scanOrder(r.q.QueryRow(ctx, `SELECT `+orderCols+` FROM orders WHERE id = $1`, id))
	if err != nil {
		return o, wrap("order by id", err)
	}
	items, err := r.itemsFor(ctx, []string{o.ID})
	if err != nil {
		return o, err
	}
	o.Items = items[o.ID]
	return o, nil
}

// List returns a page of orders, newest first, with items.
func (r *Orders) List(ctx context.Context, qry domain.OrderQuery) (domain.Paginated[domain.Order], error) {
	page, perPage, offset := pageBounds(qry.Page, qry.PerPage, 20)
	where, args := []string{"true"}, []any{}
	if qry.Status != "" {
		args = append(args, qry.Status)
		where = append(where, "status = $"+itoa(len(args)))
	}
	if qry.Type != "" {
		args = append(args, qry.Type)
		where = append(where, "type = $"+itoa(len(args)))
	}
	cond := strings.Join(where, " AND ")
	out := domain.Paginated[domain.Order]{Items: []domain.Order{}, Page: page, PerPage: perPage}
	if err := r.q.QueryRow(ctx, `SELECT count(*) FROM orders WHERE `+cond, args...).Scan(&out.Total); err != nil {
		return out, wrap("count orders", err)
	}
	args = append(args, perPage, offset)
	orders, err := r.query(ctx, `SELECT `+orderCols+` FROM orders WHERE `+cond+` ORDER BY created_at DESC, number DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return out, err
	}
	out.Items = orders
	return out, nil
}

// Recent returns the newest n orders with items.
func (r *Orders) Recent(ctx context.Context, n int) ([]domain.Order, error) {
	return r.query(ctx, `SELECT `+orderCols+` FROM orders ORDER BY created_at DESC, number DESC LIMIT $1`, n)
}

func (r *Orders) query(ctx context.Context, sql string, args ...any) ([]domain.Order, error) {
	rows, err := r.q.Query(ctx, sql, args...)
	if err != nil {
		return nil, wrap("list orders", err)
	}
	defer rows.Close()
	orders := []domain.Order{}
	ids := []string{}
	for rows.Next() {
		o, err := scanOrder(rows)
		if err != nil {
			return nil, wrap("scan order", err)
		}
		orders = append(orders, o)
		ids = append(ids, o.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, wrap("list orders", err)
	}
	items, err := r.itemsFor(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range orders {
		if list, ok := items[orders[i].ID]; ok {
			orders[i].Items = list
		}
	}
	return orders, nil
}

func (r *Orders) itemsFor(ctx context.Context, orderIDs []string) (map[string][]domain.OrderItem, error) {
	out := map[string][]domain.OrderItem{}
	if len(orderIDs) == 0 {
		return out, nil
	}
	rows, err := r.q.Query(ctx, `SELECT id, order_id, product_id, name, price_minor, quantity, total_minor FROM order_items
		WHERE order_id = ANY($1::uuid[]) ORDER BY order_id, sort_order, id`, orderIDs)
	if err != nil {
		return nil, wrap("order items", err)
	}
	defer rows.Close()
	for rows.Next() {
		var it domain.OrderItem
		var orderID string
		if err := rows.Scan(&it.ID, &orderID, &it.ProductID, &it.Name, &it.PriceMinor, &it.Quantity, &it.TotalMinor); err != nil {
			return nil, wrap("scan order item", err)
		}
		out[orderID] = append(out[orderID], it)
	}
	return out, wrap("order items", rows.Err())
}

// SetStatus updates the order status.
func (r *Orders) SetStatus(ctx context.Context, id string, status domain.OrderStatus) (domain.Order, error) {
	tag, err := r.q.Exec(ctx, `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, id, status)
	if err != nil {
		return domain.Order{}, wrap("set order status", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.Order{}, domain.ErrNotFound
	}
	return r.ByID(ctx, id)
}

// Delete removes an order and its items.
func (r *Orders) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM orders WHERE id = $1`, id)
	if err != nil {
		return wrap("delete order", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// Counts returns dashboard order totals; dayStart is the start of "today" in the business timezone.
func (r *Orders) Counts(ctx context.Context, dayStart time.Time) (domain.OrderCounts, error) {
	var c domain.OrderCounts
	err := r.q.QueryRow(ctx, `SELECT count(*) FILTER (WHERE status = 'new'), count(*) FILTER (WHERE created_at >= $1), count(*) FROM orders`, dayStart).
		Scan(&c.New, &c.Today, &c.Total)
	return c, wrap("count orders", err)
}
