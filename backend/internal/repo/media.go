package repo

import (
	"context"
	"strings"

	"merenda/backend/internal/domain"
)

// Media persists uploaded files' metadata.
type Media struct {
	q   Querier
	url URLFunc
}

const mediaRecordCols = `id, kind, mime, path, thumb_path, medium_path, width, height, size, original_name, alt, created_at`

func scanMediaRecord(row interface{ Scan(dest ...any) error }) (domain.MediaRecord, error) {
	var m domain.MediaRecord
	err := row.Scan(&m.ID, &m.Kind, &m.Mime, &m.Path, &m.ThumbPath, &m.MediumPath, &m.Width, &m.Height, &m.Size, &m.OriginalName, &m.Alt, &m.CreatedAt)
	return m, err
}

// View converts a record to its API shape.
func (r *Media) View(rec domain.MediaRecord) domain.Media { return toMediaView(rec, r.url) }

// Create inserts a media row.
func (r *Media) Create(ctx context.Context, m domain.MediaRecord) (domain.MediaRecord, error) {
	row := r.q.QueryRow(ctx, `INSERT INTO media (kind, mime, path, thumb_path, medium_path, width, height, size, original_name, alt)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING `+mediaRecordCols,
		m.Kind, m.Mime, m.Path, m.ThumbPath, m.MediumPath, m.Width, m.Height, m.Size, m.OriginalName, m.Alt)
	rec, err := scanMediaRecord(row)
	return rec, wrap("create media", err)
}

// ByID loads one media record.
func (r *Media) ByID(ctx context.Context, id string) (domain.MediaRecord, error) {
	row := r.q.QueryRow(ctx, `SELECT `+mediaRecordCols+` FROM media WHERE id = $1`, id)
	rec, err := scanMediaRecord(row)
	return rec, wrap("media by id", err)
}

// UpdateAlt changes the alt text.
func (r *Media) UpdateAlt(ctx context.Context, id, alt string) (domain.MediaRecord, error) {
	row := r.q.QueryRow(ctx, `UPDATE media SET alt = $2 WHERE id = $1 RETURNING `+mediaRecordCols, id, alt)
	rec, err := scanMediaRecord(row)
	return rec, wrap("update media alt", err)
}

// Delete removes the row (references become NULL via FK).
func (r *Media) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM media WHERE id = $1`, id)
	if err != nil {
		return wrap("delete media", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// List returns a page of media, newest first.
func (r *Media) List(ctx context.Context, qry domain.MediaQuery) (domain.Paginated[domain.Media], error) {
	page, perPage, offset := pageBounds(qry.Page, qry.PerPage, 24)
	where, args := []string{"true"}, []any{}
	if qry.Kind == string(domain.MediaImage) || qry.Kind == string(domain.MediaGIF) {
		args = append(args, qry.Kind)
		where = append(where, "kind = $"+itoa(len(args)))
	}
	if q := strings.TrimSpace(qry.Q); q != "" {
		args = append(args, "%"+q+"%")
		where = append(where, "(original_name ILIKE $"+itoa(len(args))+" OR alt ILIKE $"+itoa(len(args))+")")
	}
	cond := strings.Join(where, " AND ")

	out := domain.Paginated[domain.Media]{Items: []domain.Media{}, Page: page, PerPage: perPage}
	if err := r.q.QueryRow(ctx, `SELECT count(*) FROM media WHERE `+cond, args...).Scan(&out.Total); err != nil {
		return out, wrap("count media", err)
	}
	args = append(args, perPage, offset)
	rows, err := r.q.Query(ctx, `SELECT `+mediaRecordCols+` FROM media WHERE `+cond+
		` ORDER BY created_at DESC, id DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return out, wrap("list media", err)
	}
	defer rows.Close()
	for rows.Next() {
		rec, err := scanMediaRecord(rows)
		if err != nil {
			return out, wrap("scan media", err)
		}
		out.Items = append(out.Items, r.View(rec))
	}
	return out, wrap("list media", rows.Err())
}

// ByIDs returns the media found among ids, keyed by id.
func (r *Media) ByIDs(ctx context.Context, ids []string) (map[string]domain.Media, error) {
	out := map[string]domain.Media{}
	if len(ids) == 0 {
		return out, nil
	}
	rows, err := r.q.Query(ctx, `SELECT `+mediaRecordCols+` FROM media WHERE id = ANY($1::uuid[])`, ids)
	if err != nil {
		return nil, wrap("media by ids", err)
	}
	defer rows.Close()
	for rows.Next() {
		rec, err := scanMediaRecord(rows)
		if err != nil {
			return nil, wrap("scan media", err)
		}
		out[rec.ID] = r.View(rec)
	}
	return out, wrap("media by ids", rows.Err())
}

// Count returns the number of media rows.
func (r *Media) Count(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT count(*) FROM media`).Scan(&n)
	return n, wrap("count media", err)
}
