package repo

import (
	"context"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Menus persists top-level menus (Kitchen, Bar …).
type Menus struct{ q Querier }

// WithTx binds the repository to a transaction.
func (r *Menus) WithTx(tx pgx.Tx) *Menus { return &Menus{q: tx} }

const menuCols = `id, slug, name, description, icon, sort_order, is_active, schedule_id, created_at, updated_at`

func scanMenu(row interface{ Scan(dest ...any) error }) (domain.Menu, error) {
	var m domain.Menu
	err := row.Scan(&m.ID, &m.Slug, &m.Name, &m.Description, &m.Icon, &m.SortOrder, &m.IsActive, &m.ScheduleID, &m.CreatedAt, &m.UpdatedAt)
	return m, err
}

func collectMenus(rows pgx.Rows) ([]domain.Menu, error) {
	defer rows.Close()
	out := []domain.Menu{}
	for rows.Next() {
		m, err := scanMenu(rows)
		if err != nil {
			return nil, wrap("scan menu", err)
		}
		out = append(out, m)
	}
	return out, wrap("list menus", rows.Err())
}

// List returns all menus sorted.
func (r *Menus) List(ctx context.Context) ([]domain.Menu, error) {
	rows, err := r.q.Query(ctx, `SELECT `+menuCols+` FROM menus ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, wrap("list menus", err)
	}
	return collectMenus(rows)
}

// ListActive returns active menus sorted.
func (r *Menus) ListActive(ctx context.Context) ([]domain.Menu, error) {
	rows, err := r.q.Query(ctx, `SELECT `+menuCols+` FROM menus WHERE is_active ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, wrap("list active menus", err)
	}
	return collectMenus(rows)
}

// ByID loads one menu.
func (r *Menus) ByID(ctx context.Context, id string) (domain.Menu, error) {
	m, err := scanMenu(r.q.QueryRow(ctx, `SELECT `+menuCols+` FROM menus WHERE id = $1`, id))
	return m, wrap("menu by id", err)
}

// SlugExists reports whether the slug is used by another menu.
func (r *Menus) SlugExists(ctx context.Context, slug, excludeID string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM menus WHERE slug = $1 AND ($2 = '' OR id <> $2::uuid))`, slug, excludeID).Scan(&ok)
	return ok, wrap("menu slug exists", err)
}

// NextSortOrder returns a sort_order placing a new row last.
func (r *Menus) NextSortOrder(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT coalesce(max(sort_order), -10) + 10 FROM menus`).Scan(&n)
	return n, wrap("menu sort order", err)
}

// Create inserts a menu.
func (r *Menus) Create(ctx context.Context, m domain.Menu) (domain.Menu, error) {
	row := r.q.QueryRow(ctx, `INSERT INTO menus (slug, name, description, icon, sort_order, is_active, schedule_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING `+menuCols,
		m.Slug, m.Name, m.Description, m.Icon, m.SortOrder, m.IsActive, m.ScheduleID)
	out, err := scanMenu(row)
	return out, wrap("create menu", err)
}

// Update rewrites every editable column.
func (r *Menus) Update(ctx context.Context, m domain.Menu) (domain.Menu, error) {
	row := r.q.QueryRow(ctx, `UPDATE menus SET slug = $2, name = $3, description = $4, icon = $5, is_active = $6, schedule_id = $7, updated_at = now()
		WHERE id = $1 RETURNING `+menuCols,
		m.ID, m.Slug, m.Name, m.Description, m.Icon, m.IsActive, m.ScheduleID)
	out, err := scanMenu(row)
	return out, wrap("update menu", err)
}

// Delete removes a menu (categories and products cascade).
func (r *Menus) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM menus WHERE id = $1`, id)
	if err != nil {
		return wrap("delete menu", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// Reorder assigns sort_order by index.
func (r *Menus) Reorder(ctx context.Context, ids []string) error {
	return reorder(ctx, r.q, "menus", ids)
}

// Count returns the number of menus.
func (r *Menus) Count(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT count(*) FROM menus`).Scan(&n)
	return n, wrap("count menus", err)
}
