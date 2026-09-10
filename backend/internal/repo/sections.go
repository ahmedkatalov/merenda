package repo

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Sections persists the site builder's page sections.
type Sections struct{ q Querier }

// WithTx binds the repository to a transaction.
func (r *Sections) WithTx(tx pgx.Tx) *Sections { return &Sections{q: tx} }

const sectionCols = `id, type, title, is_enabled, sort_order, is_locked, settings, created_at, updated_at`

func scanSection(row interface{ Scan(dest ...any) error }) (domain.PageSection, error) {
	var s domain.PageSection
	var settings []byte
	err := row.Scan(&s.ID, &s.Type, &s.Title, &s.IsEnabled, &s.SortOrder, &s.IsLocked, &settings, &s.CreatedAt, &s.UpdatedAt)
	if len(settings) == 0 {
		settings = []byte("{}")
	}
	s.Settings = json.RawMessage(settings)
	return s, err
}

func (r *Sections) collect(rows pgx.Rows) ([]domain.PageSection, error) {
	defer rows.Close()
	out := []domain.PageSection{}
	for rows.Next() {
		s, err := scanSection(rows)
		if err != nil {
			return nil, wrap("scan section", err)
		}
		out = append(out, s)
	}
	return out, wrap("list sections", rows.Err())
}

// List returns all sections sorted.
func (r *Sections) List(ctx context.Context) ([]domain.PageSection, error) {
	rows, err := r.q.Query(ctx, `SELECT `+sectionCols+` FROM page_sections ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, wrap("list sections", err)
	}
	return r.collect(rows)
}

// ListEnabled returns enabled sections sorted.
func (r *Sections) ListEnabled(ctx context.Context) ([]domain.PageSection, error) {
	rows, err := r.q.Query(ctx, `SELECT `+sectionCols+` FROM page_sections WHERE is_enabled ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, wrap("list enabled sections", err)
	}
	return r.collect(rows)
}

// ByID loads one section.
func (r *Sections) ByID(ctx context.Context, id string) (domain.PageSection, error) {
	s, err := scanSection(r.q.QueryRow(ctx, `SELECT `+sectionCols+` FROM page_sections WHERE id = $1`, id))
	return s, wrap("section by id", err)
}

// TypeExists reports whether a section of the type already exists.
func (r *Sections) TypeExists(ctx context.Context, sectionType string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM page_sections WHERE type = $1)`, sectionType).Scan(&ok)
	return ok, wrap("section type exists", err)
}

// NextSortOrder returns a sort_order placing a new section just before the footer.
func (r *Sections) NextSortOrder(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT coalesce(max(sort_order) FILTER (WHERE type <> 'footer'), -10) + 10 FROM page_sections`).Scan(&n)
	return n, wrap("section sort order", err)
}

// Create inserts a section.
func (r *Sections) Create(ctx context.Context, s domain.PageSection) (domain.PageSection, error) {
	row := r.q.QueryRow(ctx, `INSERT INTO page_sections (type, title, is_enabled, sort_order, is_locked, settings)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING `+sectionCols,
		s.Type, s.Title, s.IsEnabled, s.SortOrder, s.IsLocked, []byte(s.Settings))
	out, err := scanSection(row)
	return out, wrap("create section", err)
}

// Update rewrites title, enabled flag and settings.
func (r *Sections) Update(ctx context.Context, s domain.PageSection) (domain.PageSection, error) {
	row := r.q.QueryRow(ctx, `UPDATE page_sections SET title = $2, is_enabled = $3, settings = $4::jsonb, updated_at = now()
		WHERE id = $1 RETURNING `+sectionCols, s.ID, s.Title, s.IsEnabled, []byte(s.Settings))
	out, err := scanSection(row)
	return out, wrap("update section", err)
}

// Delete removes a section.
func (r *Sections) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM page_sections WHERE id = $1`, id)
	if err != nil {
		return wrap("delete section", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// Reorder assigns sort_order by index.
func (r *Sections) Reorder(ctx context.Context, ids []string) error {
	return reorder(ctx, r.q, "page_sections", ids)
}
