package repo

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Products persists menu items with their joined image/gif media.
type Products struct {
	q   Querier
	url URLFunc
}

// WithTx binds the repository to a transaction.
func (r *Products) WithTx(tx pgx.Tx) *Products { return &Products{q: tx, url: r.url} }

// OrderableProduct is what the order service needs to price and validate a line.
type OrderableProduct struct {
	ID             string
	Name           string
	PriceMinor     int64
	Availability   domain.Availability
	MenuID         string
	MenuActive     bool
	CategoryActive bool
	ScheduleID     *string
}

const productBaseCols = `p.id, p.category_id, p.slug, p.name, p.description, p.price_minor, p.old_price_minor, p.image_id, p.gif_id,
	p.availability, p.is_popular, p.is_recommended, p.is_new, p.tags, p.attributes, p.sort_order, p.created_at, p.updated_at`

func productSelect(extra string) string {
	return `SELECT ` + productBaseCols + `, ` + mediaCols("i") + `, ` + mediaCols("g") + extra +
		` FROM products p LEFT JOIN media i ON i.id = p.image_id LEFT JOIN media g ON g.id = p.gif_id `
}

// productScan holds the raw columns of one product row plus the optional list-view extras.
type productScan struct {
	p          domain.Product
	attributes []byte
	img, gif   mediaScan
	extra      struct {
		CategoryName string
		MenuID       string
		MenuName     string
	}
}

func (s *productScan) targets(withExtra bool) []any {
	p := &s.p
	t := []any{&p.ID, &p.CategoryID, &p.Slug, &p.Name, &p.Description, &p.PriceMinor, &p.OldPriceMinor, &p.ImageID, &p.GifID,
		&p.Availability, &p.IsPopular, &p.IsRecommended, &p.IsNew, &p.Tags, &s.attributes, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt}
	t = append(t, s.img.targets()...)
	t = append(t, s.gif.targets()...)
	if withExtra {
		t = append(t, &s.extra.CategoryName, &s.extra.MenuID, &s.extra.MenuName)
	}
	return t
}

func (s *productScan) finish(url URLFunc) (domain.Product, error) {
	p := s.p
	if p.Tags == nil {
		p.Tags = []string{}
	}
	p.Attributes = []domain.ProductAttribute{}
	if len(s.attributes) > 0 {
		if err := json.Unmarshal(s.attributes, &p.Attributes); err != nil {
			return p, fmt.Errorf("decode attributes: %w", err)
		}
		if p.Attributes == nil {
			p.Attributes = []domain.ProductAttribute{}
		}
	}
	p.Image = s.img.toMedia(url)
	p.Gif = s.gif.toMedia(url)
	return p, nil
}

func (r *Products) collect(rows pgx.Rows) ([]domain.Product, error) {
	defer rows.Close()
	out := []domain.Product{}
	for rows.Next() {
		var s productScan
		if err := rows.Scan(s.targets(false)...); err != nil {
			return nil, wrap("scan product", err)
		}
		p, err := s.finish(r.url)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, wrap("list products", rows.Err())
}

// ByID loads one product.
func (r *Products) ByID(ctx context.Context, id string) (domain.Product, error) {
	var s productScan
	if err := r.q.QueryRow(ctx, productSelect("")+`WHERE p.id = $1`, id).Scan(s.targets(false)...); err != nil {
		return domain.Product{}, wrap("product by id", err)
	}
	return s.finish(r.url)
}

// List returns the admin list view with category/menu names.
func (r *Products) List(ctx context.Context, qry domain.ProductQuery) ([]domain.ProductListItem, error) {
	where, args := []string{"true"}, []any{}
	if qry.MenuID != "" {
		args = append(args, qry.MenuID)
		where = append(where, "c.menu_id = $"+itoa(len(args))+"::uuid")
	}
	if qry.CategoryID != "" {
		args = append(args, qry.CategoryID)
		where = append(where, "p.category_id = $"+itoa(len(args))+"::uuid")
	}
	if qry.Availability != "" {
		args = append(args, qry.Availability)
		where = append(where, "p.availability = $"+itoa(len(args)))
	}
	if q := strings.TrimSpace(qry.Q); q != "" {
		args = append(args, "%"+q+"%")
		where = append(where, "(p.name ILIKE $"+itoa(len(args))+" OR p.description ILIKE $"+itoa(len(args))+" OR $"+itoa(len(args))+" = ANY(p.tags))")
	}
	sql := productSelect(", c.name, m.id, m.name") +
		`JOIN categories c ON c.id = p.category_id JOIN menus m ON m.id = c.menu_id WHERE ` + strings.Join(where, " AND ") +
		` ORDER BY m.sort_order, c.sort_order, p.sort_order, p.created_at`
	rows, err := r.q.Query(ctx, sql, args...)
	if err != nil {
		return nil, wrap("list products", err)
	}
	defer rows.Close()
	out := []domain.ProductListItem{}
	for rows.Next() {
		var s productScan
		if err := rows.Scan(s.targets(true)...); err != nil {
			return nil, wrap("scan product", err)
		}
		p, err := s.finish(r.url)
		if err != nil {
			return nil, err
		}
		out = append(out, domain.ProductListItem{Product: p, CategoryName: s.extra.CategoryName, MenuID: s.extra.MenuID, MenuName: s.extra.MenuName})
	}
	return out, wrap("list products", rows.Err())
}

// ListVisibleForCategories returns non-hidden products of the categories, sorted.
func (r *Products) ListVisibleForCategories(ctx context.Context, categoryIDs []string) ([]domain.Product, error) {
	rows, err := r.q.Query(ctx, productSelect("")+`WHERE p.availability <> 'hidden' AND p.category_id = ANY($1::uuid[]) ORDER BY p.sort_order, p.created_at`, categoryIDs)
	if err != nil {
		return nil, wrap("list visible products", err)
	}
	return r.collect(rows)
}

// SlugExists reports whether the slug is used by another product in the category.
func (r *Products) SlugExists(ctx context.Context, categoryID, slug, excludeID string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM products WHERE category_id = $1 AND slug = $2 AND ($3 = '' OR id <> $3::uuid))`, categoryID, slug, excludeID).Scan(&ok)
	return ok, wrap("product slug exists", err)
}

// NextSortOrder returns a sort_order placing a new row last in its category.
func (r *Products) NextSortOrder(ctx context.Context, categoryID string) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT coalesce(max(sort_order), -10) + 10 FROM products WHERE category_id = $1`, categoryID).Scan(&n)
	return n, wrap("product sort order", err)
}

// Create inserts a product.
func (r *Products) Create(ctx context.Context, p domain.Product) (domain.Product, error) {
	attrs, err := json.Marshal(p.Attributes)
	if err != nil {
		return p, fmt.Errorf("encode attributes: %w", err)
	}
	var id string
	err = r.q.QueryRow(ctx, `INSERT INTO products (category_id, slug, name, description, price_minor, old_price_minor, image_id, gif_id,
		availability, is_popular, is_recommended, is_new, tags, attributes, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
		p.CategoryID, p.Slug, p.Name, p.Description, p.PriceMinor, p.OldPriceMinor, p.ImageID, p.GifID,
		p.Availability, p.IsPopular, p.IsRecommended, p.IsNew, p.Tags, attrs, p.SortOrder).Scan(&id)
	if err != nil {
		return p, wrap("create product", err)
	}
	return r.ByID(ctx, id)
}

// Update rewrites every editable column.
func (r *Products) Update(ctx context.Context, p domain.Product) (domain.Product, error) {
	attrs, err := json.Marshal(p.Attributes)
	if err != nil {
		return p, fmt.Errorf("encode attributes: %w", err)
	}
	tag, err := r.q.Exec(ctx, `UPDATE products SET category_id = $2, slug = $3, name = $4, description = $5, price_minor = $6, old_price_minor = $7,
		image_id = $8, gif_id = $9, availability = $10, is_popular = $11, is_recommended = $12, is_new = $13, tags = $14, attributes = $15, updated_at = now()
		WHERE id = $1`,
		p.ID, p.CategoryID, p.Slug, p.Name, p.Description, p.PriceMinor, p.OldPriceMinor, p.ImageID, p.GifID,
		p.Availability, p.IsPopular, p.IsRecommended, p.IsNew, p.Tags, attrs)
	if err != nil {
		return p, wrap("update product", err)
	}
	if tag.RowsAffected() == 0 {
		return p, domain.ErrNotFound
	}
	return r.ByID(ctx, p.ID)
}

// SetAvailability changes only the availability.
func (r *Products) SetAvailability(ctx context.Context, id string, a domain.Availability) (domain.Product, error) {
	tag, err := r.q.Exec(ctx, `UPDATE products SET availability = $2, updated_at = now() WHERE id = $1`, id, a)
	if err != nil {
		return domain.Product{}, wrap("set availability", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.Product{}, domain.ErrNotFound
	}
	return r.ByID(ctx, id)
}

// Delete removes a product.
func (r *Products) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return wrap("delete product", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// Reorder assigns sort_order by index.
func (r *Products) Reorder(ctx context.Context, ids []string) error {
	return reorder(ctx, r.q, "products", ids)
}

// Counts returns product totals per availability.
func (r *Products) Counts(ctx context.Context) (domain.ProductCounts, error) {
	var c domain.ProductCounts
	err := r.q.QueryRow(ctx, `SELECT count(*),
		count(*) FILTER (WHERE availability = 'available'),
		count(*) FILTER (WHERE availability = 'unavailable'),
		count(*) FILTER (WHERE availability = 'hidden') FROM products`).Scan(&c.Total, &c.Available, &c.Unavailable, &c.Hidden)
	return c, wrap("count products", err)
}

// ForOrder loads pricing data for the given product ids, keyed by id.
func (r *Products) ForOrder(ctx context.Context, ids []string) (map[string]OrderableProduct, error) {
	rows, err := r.q.Query(ctx, `SELECT p.id, p.name, p.price_minor, p.availability, m.id, m.is_active, c.is_active, m.schedule_id
		FROM products p JOIN categories c ON c.id = p.category_id JOIN menus m ON m.id = c.menu_id
		WHERE p.id = ANY($1::uuid[])`, ids)
	if err != nil {
		return nil, wrap("products for order", err)
	}
	defer rows.Close()
	out := map[string]OrderableProduct{}
	for rows.Next() {
		var p OrderableProduct
		if err := rows.Scan(&p.ID, &p.Name, &p.PriceMinor, &p.Availability, &p.MenuID, &p.MenuActive, &p.CategoryActive, &p.ScheduleID); err != nil {
			return nil, wrap("scan orderable product", err)
		}
		out[p.ID] = p
	}
	return out, wrap("products for order", rows.Err())
}

// LatestUpdate returns the most recent product update time (for the sitemap).
func (r *Products) LatestUpdate(ctx context.Context) (*string, error) {
	var ts *string
	err := r.q.QueryRow(ctx, `SELECT to_char(max(updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD') FROM products`).Scan(&ts)
	return ts, wrap("latest product update", err)
}
