package repo

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
)

// Sessions persists refresh-token sessions.
type Sessions struct{ q Querier }

// WithTx binds the repository to a transaction.
func (r *Sessions) WithTx(tx pgx.Tx) *Sessions { return &Sessions{q: tx} }

const sessionCols = `id, admin_id, token_hash, user_agent, ip, expires_at, revoked_at, created_at`

func scanSession(row interface{ Scan(dest ...any) error }) (domain.Session, error) {
	var s domain.Session
	err := row.Scan(&s.ID, &s.AdminID, &s.TokenHash, &s.UserAgent, &s.IP, &s.ExpiresAt, &s.RevokedAt, &s.CreatedAt)
	return s, err
}

// Create inserts a new session row.
func (r *Sessions) Create(ctx context.Context, adminID, tokenHash, userAgent, ip string, expiresAt time.Time) (domain.Session, error) {
	row := r.q.QueryRow(ctx, `INSERT INTO admin_sessions (admin_id, token_hash, user_agent, ip, expires_at)
		VALUES ($1, $2, $3, $4, $5) RETURNING `+sessionCols, adminID, tokenHash, userAgent, ip, expiresAt)
	s, err := scanSession(row)
	return s, wrap("create session", err)
}

// ActiveByTokenHash returns the non-revoked, non-expired session for the token hash.
func (r *Sessions) ActiveByTokenHash(ctx context.Context, tokenHash string) (domain.Session, error) {
	row := r.q.QueryRow(ctx, `SELECT `+sessionCols+` FROM admin_sessions
		WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`, tokenHash)
	s, err := scanSession(row)
	return s, wrap("session by token", err)
}

// IsActive reports whether the session id is still usable.
func (r *Sessions) IsActive(ctx context.Context, id string) (bool, error) {
	var ok bool
	err := r.q.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM admin_sessions WHERE id = $1 AND revoked_at IS NULL AND expires_at > now())`, id).Scan(&ok)
	return ok, wrap("session active", err)
}

// Revoke marks one session revoked; missing sessions are ignored.
func (r *Sessions) Revoke(ctx context.Context, id string) error {
	_, err := r.q.Exec(ctx, `UPDATE admin_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, id)
	return wrap("revoke session", err)
}

// RevokeOwned revokes a session only if it belongs to the admin.
func (r *Sessions) RevokeOwned(ctx context.Context, adminID, id string) error {
	tag, err := r.q.Exec(ctx, `UPDATE admin_sessions SET revoked_at = now() WHERE id = $1 AND admin_id = $2 AND revoked_at IS NULL AND expires_at > now()`, id, adminID)
	if err != nil {
		return wrap("revoke session", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// RevokeOthers revokes every active session of the admin except keepID.
func (r *Sessions) RevokeOthers(ctx context.Context, adminID, keepID string) error {
	_, err := r.q.Exec(ctx, `UPDATE admin_sessions SET revoked_at = now() WHERE admin_id = $1 AND id <> $2 AND revoked_at IS NULL`, adminID, keepID)
	return wrap("revoke other sessions", err)
}

// ListActive returns the admin's live sessions, newest first.
func (r *Sessions) ListActive(ctx context.Context, adminID string) ([]domain.Session, error) {
	rows, err := r.q.Query(ctx, `SELECT `+sessionCols+` FROM admin_sessions
		WHERE admin_id = $1 AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC`, adminID)
	if err != nil {
		return nil, wrap("list sessions", err)
	}
	defer rows.Close()
	out := []domain.Session{}
	for rows.Next() {
		s, err := scanSession(rows)
		if err != nil {
			return nil, wrap("scan session", err)
		}
		out = append(out, s)
	}
	return out, wrap("list sessions", rows.Err())
}

// DeleteExpired removes stale rows (housekeeping).
func (r *Sessions) DeleteExpired(ctx context.Context) error {
	_, err := r.q.Exec(ctx, `DELETE FROM admin_sessions WHERE expires_at < now() - interval '7 days' OR revoked_at < now() - interval '7 days'`)
	return wrap("delete expired sessions", err)
}
