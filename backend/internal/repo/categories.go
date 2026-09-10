package repo

import (
	"context"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Categories persists menu categories with their joined image.
type Categories struct {
	q   Querier
	url URLFunc
}

// WithTx binds the repository to a transaction.
func (r *Categories) WithTx(tx pgx.Tx) *Categories { return &Categories{q: tx, url: r.url} }

func categorySelect() string {
	return `SELECT c.id, c.menu_id, c.slug, c.name, c.description, c.image_id, c.sort_order, c.is_active, c.created_at, c.updated_at, ` +
		mediaCols("i") + ` FROM categories c LEFT JOIN media i ON i.id = c.image_id `
}

func scanCategory(row interface{ Scan(dest ...any) error }, url URLFunc) (domain.Category, error) {
	var c domain.Category
	var img mediaScan
	targets := append([]any{&c.ID, &c.MenuID, &c.Slug, &c.Name, &c.Description, &c.ImageID, &c.SortOrder, &c.IsActive, &c.CreatedAt, &c.UpdatedAt}, img.targets()...)
	if err := row.Scan(targets...); err != nil {
		return c, err
	}
	c.Image = img.toMedia(url)
	return c, nil
}

func (r *Categories) collect(rows pgx.Rows) ([]domain.Category, error) {
	defer rows.Close()
	out := []domain.Category{}
	for rows.Next() {
		c, err := scanCategory(rows, r.url)
		if err != nil {
			return nil, wrap("scan category", err)
		}
		out = append(out, c)
	}
	return out, wrap("list categories", rows.Err())
}

// List returns categories, optionally filtered by menu.
func (r *Categories) List(ctx context.Context, menuID string) ([]domain.Category, error) {
	rows, err := r.q.Query(ctx, categorySelect()+`WHERE ($1 = '' OR c.menu_id = $1::uuid) ORDER BY c.menu_id, c.sort_order, c.created_at`, menuID)
	if err != nil {
		return nil, wrap("list categories", err)
	}
	return r.collect(rows)
}

// ListActiveForMenus returns active categories of the given menus.
func (r *Categories) ListActiveForMenus(ctx context.Context, menuIDs []string) ([]domain.Category, error) {
	rows, err := r.q.Query(ctx, categorySelect()+`WHERE c.is_active AND c.menu_id = ANY($1::uuid[]) ORDER BY c.sort_order, c.created_at`, menuIDs)
	if err != nil {
		return nil, wrap("list active categories", err)
	}
	return r.collect(rows)
}

// ByID loads one category.
func (r *Categories) ByID(ctx context.Context, id string) (domain.Category, error) {
	c, err := scanCategory(r.q.QueryRow(ctx, categorySelect()+`WHERE c.id = $1`, id), r.url)
	return c, wrap("category by id", err)
}

// SlugExists reports whether the slug is used by another category in the menu.
func (r *Categories) SlugExists(ctx context.Context, menuID, slug, excludeID string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM categories WHERE menu_id = $1 AND slug = $2 AND ($3 = '' OR id <> $3::uuid))`, menuID, slug, excludeID).Scan(&ok)
	return ok, wrap("category slug exists", err)
}

// NextSortOrder returns a sort_order placing a new row last in its menu.
func (r *Categories) NextSortOrder(ctx context.Context, menuID string) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT coalesce(max(sort_order), -10) + 10 FROM categories WHERE menu_id = $1`, menuID).Scan(&n)
	return n, wrap("category sort order", err)
}

// Create inserts a category.
func (r *Categories) Create(ctx context.Context, c domain.Category) (domain.Category, error) {
	var id string
	err := r.q.QueryRow(ctx, `INSERT INTO categories (menu_id, slug, name, description, image_id, sort_order, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		c.MenuID, c.Slug, c.Name, c.Description, c.ImageID, c.SortOrder, c.IsActive).Scan(&id)
	if err != nil {
		return c, wrap("create category", err)
	}
	return r.ByID(ctx, id)
}

// Update rewrites every editable column.
func (r *Categories) Update(ctx context.Context, c domain.Category) (domain.Category, error) {
	tag, err := r.q.Exec(ctx, `UPDATE categories SET menu_id = $2, slug = $3, name = $4, description = $5, image_id = $6, is_active = $7, updated_at = now() WHERE id = $1`,
		c.ID, c.MenuID, c.Slug, c.Name, c.Description, c.ImageID, c.IsActive)
	if err != nil {
		return c, wrap("update category", err)
	}
	if tag.RowsAffected() == 0 {
		return c, domain.ErrNotFound
	}
	return r.ByID(ctx, c.ID)
}

// Delete removes a category (products cascade).
func (r *Categories) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		return wrap("delete category", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// Reorder assigns sort_order by index.
func (r *Categories) Reorder(ctx context.Context, ids []string) error {
	return reorder(ctx, r.q, "categories", ids)
}

// Count returns the number of categories.
func (r *Categories) Count(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT count(*) FROM categories`).Scan(&n)
	return n, wrap("count categories", err)
}
