// Package repo contains the SQL access layer, one file per aggregate.
// Every method accepts a context and uses parameterized queries only.
package repo

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"merenda/backend/internal/domain"
)

// Querier is satisfied by both *pgxpool.Pool and pgx.Tx.
type Querier interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// URLFunc maps a stored relative media path to its public URL.
type URLFunc func(relPath string) string

// Repos bundles every repository bound to the shared pool.
type Repos struct {
	pool       *pgxpool.Pool
	Admins     *Admins
	Sessions   *Sessions
	Media      *Media
	Menus      *Menus
	Categories *Categories
	Products   *Products
	Orders     *Orders
	Schedules  *Schedules
	Settings   *Settings
	Sections   *Sections
}

// New wires all repositories to the pool.
func New(pool *pgxpool.Pool, mediaURL URLFunc) *Repos {
	return &Repos{
		pool:       pool,
		Admins:     &Admins{q: pool},
		Sessions:   &Sessions{q: pool},
		Media:      &Media{q: pool, url: mediaURL},
		Menus:      &Menus{q: pool},
		Categories: &Categories{q: pool, url: mediaURL},
		Products:   &Products{q: pool, url: mediaURL},
		Orders:     &Orders{q: pool},
		Schedules:  &Schedules{q: pool},
		Settings:   &Settings{q: pool},
		Sections:   &Sections{q: pool},
	}
}

// Tx runs fn inside a transaction, committing when it returns nil.
func (r *Repos) Tx(ctx context.Context, fn func(ctx context.Context, tx pgx.Tx) error) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(context.WithoutCancel(ctx)) //nolint:errcheck
	if err := fn(ctx, tx); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

// Ping checks database connectivity (used by /healthz).
func (r *Repos) Ping(ctx context.Context) error { return r.pool.Ping(ctx) }

// wrap converts pgx errors into domain errors where meaningful.
func wrap(op string, err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			return domain.Conflict("Запись с такими данными уже существует")
		case "23503": // foreign_key_violation
			return &domain.ValidationError{Message: "Ссылка на несуществующую запись", Fields: map[string]string{fkField(pgErr.ConstraintName): "Запись не найдена"}}
		}
	}
	return fmt.Errorf("%s: %w", op, err)
}

// fkField guesses the JSON field name from a foreign-key constraint name like "products_image_id_fkey".
func fkField(constraint string) string {
	parts := strings.Split(strings.TrimSuffix(constraint, "_fkey"), "_")
	if len(parts) < 2 {
		return "id"
	}
	col := strings.Join(parts[1:], "_")
	return snakeToCamel(col)
}

func snakeToCamel(s string) string {
	parts := strings.Split(s, "_")
	for i := 1; i < len(parts); i++ {
		if parts[i] != "" {
			parts[i] = strings.ToUpper(parts[i][:1]) + parts[i][1:]
		}
	}
	return strings.Join(parts, "")
}

// mediaCols lists the media columns with alias a, in the order scanMedia expects.
func mediaCols(a string) string {
	cols := []string{"id", "kind", "mime", "path", "thumb_path", "medium_path", "width", "height", "size", "original_name", "alt", "created_at"}
	for i, c := range cols {
		cols[i] = a + "." + c
	}
	return strings.Join(cols, ", ")
}

// mediaScan receives a LEFT JOINed media row (all fields nullable).
type mediaScan struct {
	ID           *string
	Kind         *string
	Mime         *string
	Path         *string
	ThumbPath    *string
	MediumPath   *string
	Width        *int
	Height       *int
	Size         *int64
	OriginalName *string
	Alt          *string
	CreatedAt    *time.Time
}

func (m *mediaScan) targets() []any {
	return []any{&m.ID, &m.Kind, &m.Mime, &m.Path, &m.ThumbPath, &m.MediumPath, &m.Width, &m.Height, &m.Size, &m.OriginalName, &m.Alt, &m.CreatedAt}
}

func (m *mediaScan) toMedia(url URLFunc) *domain.Media {
	if m.ID == nil {
		return nil
	}
	rec := domain.MediaRecord{
		ID: *m.ID, Kind: domain.MediaKind(*m.Kind), Mime: *m.Mime, Path: *m.Path,
		ThumbPath: *m.ThumbPath, MediumPath: *m.MediumPath, Width: *m.Width, Height: *m.Height,
		Size: *m.Size, OriginalName: *m.OriginalName, Alt: *m.Alt, CreatedAt: *m.CreatedAt,
	}
	v := toMediaView(rec, url)
	return &v
}

// toMediaView converts a stored record into the API shape.
func toMediaView(rec domain.MediaRecord, url URLFunc) domain.Media {
	thumb, medium := rec.Path, rec.Path
	if rec.ThumbPath != "" {
		thumb = rec.ThumbPath
	}
	if rec.MediumPath != "" {
		medium = rec.MediumPath
	}
	return domain.Media{
		ID: rec.ID, Kind: rec.Kind, Mime: rec.Mime,
		URL: url(rec.Path), ThumbURL: url(thumb), MediumURL: url(medium),
		Width: rec.Width, Height: rec.Height, Size: rec.Size,
		OriginalName: rec.OriginalName, Alt: rec.Alt, CreatedAt: rec.CreatedAt,
	}
}

// reorder assigns sort_order = index*10 to ids inside a single statement.
func reorder(ctx context.Context, q Querier, table string, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	orders := make([]int, len(ids))
	for i := range ids {
		orders[i] = i * 10
	}
	sql := fmt.Sprintf(`UPDATE %s AS t SET sort_order = v.ord, updated_at = now()
		FROM unnest($1::uuid[], $2::int[]) AS v(id, ord) WHERE t.id = v.id`, table)
	_, err := q.Exec(ctx, sql, ids, orders)
	return wrap("reorder "+table, err)
}

// pageBounds normalizes pagination values.
func pageBounds(page, perPage, defPerPage int) (int, int, int) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = defPerPage
	}
	if perPage > 100 {
		perPage = 100
	}
	return page, perPage, (page - 1) * perPage
}
