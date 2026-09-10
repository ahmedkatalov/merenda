package repo

import (
	"context"
	"strings"

	"merenda/backend/internal/domain"
)

// Admins persists admin accounts.
type Admins struct{ q Querier }

const adminCols = `id, email, name, role, last_login_at, created_at, updated_at, password_hash`

func scanAdmin(row interface{ Scan(dest ...any) error }) (domain.Admin, error) {
	var a domain.Admin
	err := row.Scan(&a.ID, &a.Email, &a.Name, &a.Role, &a.LastLoginAt, &a.CreatedAt, &a.UpdatedAt, &a.PasswordHash)
	return a, err
}

// Count returns the number of admin rows.
func (r *Admins) Count(ctx context.Context) (int, error) {
	var n int
	err := r.q.QueryRow(ctx, `SELECT count(*) FROM admins`).Scan(&n)
	return n, wrap("count admins", err)
}

// Create inserts an admin and returns it.
func (r *Admins) Create(ctx context.Context, email, name, passwordHash, role string) (domain.Admin, error) {
	row := r.q.QueryRow(ctx, `INSERT INTO admins (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING `+adminCols,
		strings.ToLower(strings.TrimSpace(email)), name, passwordHash, role)
	a, err := scanAdmin(row)
	return a, wrap("create admin", err)
}

// ByEmail finds an admin by e-mail (case-insensitive).
func (r *Admins) ByEmail(ctx context.Context, email string) (domain.Admin, error) {
	row := r.q.QueryRow(ctx, `SELECT `+adminCols+` FROM admins WHERE lower(email) = lower($1)`, strings.TrimSpace(email))
	a, err := scanAdmin(row)
	return a, wrap("admin by email", err)
}

// ByID finds an admin by id.
func (r *Admins) ByID(ctx context.Context, id string) (domain.Admin, error) {
	row := r.q.QueryRow(ctx, `SELECT `+adminCols+` FROM admins WHERE id = $1`, id)
	a, err := scanAdmin(row)
	return a, wrap("admin by id", err)
}

// TouchLogin records a successful login.
func (r *Admins) TouchLogin(ctx context.Context, id string) error {
	_, err := r.q.Exec(ctx, `UPDATE admins SET last_login_at = now() WHERE id = $1`, id)
	return wrap("touch login", err)
}

// UpdateProfile changes name and e-mail.
func (r *Admins) UpdateProfile(ctx context.Context, id, name, email string) (domain.Admin, error) {
	row := r.q.QueryRow(ctx, `UPDATE admins SET name = $2, email = $3, updated_at = now() WHERE id = $1 RETURNING `+adminCols,
		id, name, strings.ToLower(strings.TrimSpace(email)))
	a, err := scanAdmin(row)
	return a, wrap("update profile", err)
}

// UpdatePassword stores a new password hash.
func (r *Admins) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	_, err := r.q.Exec(ctx, `UPDATE admins SET password_hash = $2, updated_at = now() WHERE id = $1`, id, passwordHash)
	return wrap("update password", err)
}
