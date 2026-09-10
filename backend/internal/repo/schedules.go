package repo

import (
	"context"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Schedules persists working-hour schedules, their 7 day rows and exceptions.
type Schedules struct{ q Querier }

// WithTx binds the repository to a transaction.
func (r *Schedules) WithTx(tx pgx.Tx) *Schedules { return &Schedules{q: tx} }

const scheduleCols = `id, key, name, kind, sort_order, created_at, updated_at`

func scanSchedule(row interface{ Scan(dest ...any) error }) (domain.Schedule, error) {
	var s domain.Schedule
	err := row.Scan(&s.ID, &s.Key, &s.Name, &s.Kind, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt)
	s.Hours = []domain.ScheduleDay{}
	s.Exceptions = []domain.ScheduleException{}
	return s, err
}

// List returns every schedule (venue first) with hours and exceptions.
func (r *Schedules) List(ctx context.Context) ([]domain.Schedule, error) {
	rows, err := r.q.Query(ctx, `SELECT `+scheduleCols+` FROM schedules ORDER BY (kind = 'venue') DESC, sort_order, created_at`)
	if err != nil {
		return nil, wrap("list schedules", err)
	}
	defer rows.Close()
	out := []domain.Schedule{}
	for rows.Next() {
		s, err := scanSchedule(rows)
		if err != nil {
			return nil, wrap("scan schedule", err)
		}
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		return nil, wrap("list schedules", err)
	}
	for i := range out {
		if err := r.fill(ctx, &out[i]); err != nil {
			return nil, err
		}
	}
	return out, nil
}

// ByID loads one schedule with hours and exceptions.
func (r *Schedules) ByID(ctx context.Context, id string) (domain.Schedule, error) {
	s, err := scanSchedule(r.q.QueryRow(ctx, `SELECT `+scheduleCols+` FROM schedules WHERE id = $1`, id))
	if err != nil {
		return s, wrap("schedule by id", err)
	}
	return s, r.fill(ctx, &s)
}

// Exists reports whether a schedule id is present.
func (r *Schedules) Exists(ctx context.Context, id string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM schedules WHERE id = $1)`, id).Scan(&ok)
	return ok, wrap("schedule exists", err)
}

// KeyExists reports whether the key is used by another schedule.
func (r *Schedules) KeyExists(ctx context.Context, key, excludeID string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM schedules WHERE key = $1 AND ($2 = '' OR id <> $2::uuid))`, key, excludeID).Scan(&ok)
	return ok, wrap("schedule key exists", err)
}

func (r *Schedules) fill(ctx context.Context, s *domain.Schedule) error {
	rows, err := r.q.Query(ctx, `SELECT weekday, is_closed, to_char(opens_at, 'HH24:MI'), to_char(closes_at, 'HH24:MI')
		FROM schedule_hours WHERE schedule_id = $1 ORDER BY weekday`, s.ID)
	if err != nil {
		return wrap("schedule hours", err)
	}
	defer rows.Close()
	for rows.Next() {
		var d domain.ScheduleDay
		if err := rows.Scan(&d.Weekday, &d.IsClosed, &d.OpensAt, &d.ClosesAt); err != nil {
			return wrap("scan schedule day", err)
		}
		s.Hours = append(s.Hours, d)
	}
	if err := rows.Err(); err != nil {
		return wrap("schedule hours", err)
	}
	if len(s.Hours) != 7 {
		s.Hours = mergeDefaultHours(s.Hours)
	}

	exRows, err := r.q.Query(ctx, `SELECT id, schedule_id, to_char(date, 'YYYY-MM-DD'), is_closed, to_char(opens_at, 'HH24:MI'), to_char(closes_at, 'HH24:MI'), note
		FROM schedule_exceptions WHERE schedule_id = $1 ORDER BY date`, s.ID)
	if err != nil {
		return wrap("schedule exceptions", err)
	}
	defer exRows.Close()
	for exRows.Next() {
		var e domain.ScheduleException
		if err := exRows.Scan(&e.ID, &e.ScheduleID, &e.Date, &e.IsClosed, &e.OpensAt, &e.ClosesAt, &e.Note); err != nil {
			return wrap("scan schedule exception", err)
		}
		s.Exceptions = append(s.Exceptions, e)
	}
	return wrap("schedule exceptions", exRows.Err())
}

// mergeDefaultHours guarantees 7 rows even if some weekday rows are missing.
func mergeDefaultHours(have []domain.ScheduleDay) []domain.ScheduleDay {
	out := domain.DefaultHours()
	for _, d := range have {
		if d.Weekday >= 0 && d.Weekday < 7 {
			out[d.Weekday] = d
		}
	}
	return out
}

// NextSortOrder returns a sort_order placing a new schedule last.
func (r *Schedules) NextSortOrder(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT coalesce(max(sort_order), -1) + 1 FROM schedules`).Scan(&n)
	return n, wrap("schedule sort order", err)
}

// Create inserts a schedule row (hours are written with ReplaceHours).
func (r *Schedules) Create(ctx context.Context, key, name string, kind domain.ScheduleKind, sortOrder int) (string, error) {
	var id string
	err := r.q.QueryRow(ctx, `INSERT INTO schedules (key, name, kind, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`, key, name, kind, sortOrder).Scan(&id)
	return id, wrap("create schedule", err)
}

// Update changes name and key.
func (r *Schedules) Update(ctx context.Context, id, key, name string) error {
	tag, err := r.q.Exec(ctx, `UPDATE schedules SET key = $2, name = $3, updated_at = now() WHERE id = $1`, id, key, name)
	if err != nil {
		return wrap("update schedule", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// ReplaceHours upserts all 7 day rows.
func (r *Schedules) ReplaceHours(ctx context.Context, id string, hours []domain.ScheduleDay) error {
	for _, d := range hours {
		_, err := r.q.Exec(ctx, `INSERT INTO schedule_hours (schedule_id, weekday, is_closed, opens_at, closes_at)
			VALUES ($1, $2, $3, $4::time, $5::time)
			ON CONFLICT (schedule_id, weekday) DO UPDATE SET is_closed = EXCLUDED.is_closed, opens_at = EXCLUDED.opens_at, closes_at = EXCLUDED.closes_at`,
			id, d.Weekday, d.IsClosed, d.OpensAt, d.ClosesAt)
		if err != nil {
			return wrap("replace schedule hours", err)
		}
	}
	_, err := r.q.Exec(ctx, `UPDATE schedules SET updated_at = now() WHERE id = $1`, id)
	return wrap("touch schedule", err)
}

// Delete removes a schedule (hours/exceptions cascade; menus lose the reference).
func (r *Schedules) Delete(ctx context.Context, id string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM schedules WHERE id = $1`, id)
	if err != nil {
		return wrap("delete schedule", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// UpsertException inserts or replaces the exception for a date.
func (r *Schedules) UpsertException(ctx context.Context, scheduleID string, in domain.ScheduleExceptionInput) (domain.ScheduleException, error) {
	note := ""
	if in.Note != nil {
		note = *in.Note
	}
	var e domain.ScheduleException
	err := r.q.QueryRow(ctx, `INSERT INTO schedule_exceptions (schedule_id, date, is_closed, opens_at, closes_at, note)
		VALUES ($1, $2::date, $3, $4::time, $5::time, $6)
		ON CONFLICT (schedule_id, date) DO UPDATE SET is_closed = EXCLUDED.is_closed, opens_at = EXCLUDED.opens_at, closes_at = EXCLUDED.closes_at, note = EXCLUDED.note
		RETURNING id, schedule_id, to_char(date, 'YYYY-MM-DD'), is_closed, to_char(opens_at, 'HH24:MI'), to_char(closes_at, 'HH24:MI'), note`,
		scheduleID, in.Date, in.IsClosed, in.OpensAt, in.ClosesAt, note).
		Scan(&e.ID, &e.ScheduleID, &e.Date, &e.IsClosed, &e.OpensAt, &e.ClosesAt, &e.Note)
	if err != nil {
		return e, wrap("upsert exception", err)
	}
	_, err = r.q.Exec(ctx, `UPDATE schedules SET updated_at = now() WHERE id = $1`, scheduleID)
	return e, wrap("touch schedule", err)
}

// DeleteException removes an exception belonging to the schedule.
func (r *Schedules) DeleteException(ctx context.Context, scheduleID, exceptionID string) error {
	tag, err := r.q.Exec(ctx, `DELETE FROM schedule_exceptions WHERE id = $1 AND schedule_id = $2`, exceptionID, scheduleID)
	if err != nil {
		return wrap("delete exception", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
