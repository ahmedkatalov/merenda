// Package auth implements admin authentication: argon2id passwords, HS256 access
// tokens, rotating refresh sessions and login throttling.
package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync/atomic"
	"time"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
)

// Options configures the service.
type Options struct {
	Secret     string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
	// SeedEmail/SeedPassword/SeedName create the first admin when the table is empty.
	SeedEmail    string
	SeedPassword string
	SeedName     string
}

// Service is the auth use-case layer.
type Service struct {
	repos      *repo.Repos
	log        *slog.Logger
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
	seed       Options
	throttle   *loginThrottle
	// defaultPassword is true while the seeded admin still uses the env password.
	defaultPassword atomic.Bool
}

// New creates the service.
func New(repos *repo.Repos, log *slog.Logger, opts Options) *Service {
	return &Service{
		repos: repos, log: log, secret: []byte(opts.Secret),
		accessTTL: opts.AccessTTL, refreshTTL: opts.RefreshTTL, seed: opts, throttle: newLoginThrottle(),
	}
}

// RefreshTTL is exposed for the cookie max-age.
func (s *Service) RefreshTTL() time.Duration { return s.refreshTTL }

// DefaultPasswordInUse reports whether the seeded admin still uses the env password.
func (s *Service) DefaultPasswordInUse() bool { return s.defaultPassword.Load() }

// LoginResult bundles the API response with the refresh token to set as a cookie.
type LoginResult struct {
	Response     domain.LoginResponse
	RefreshToken string
}

// EnsureSeedAdmin creates the initial admin when no admins exist and records whether the
// env password is still in use.
func (s *Service) EnsureSeedAdmin(ctx context.Context) error {
	n, err := s.repos.Admins.Count(ctx)
	if err != nil {
		return err
	}
	if n == 0 {
		if s.seed.SeedEmail == "" || s.seed.SeedPassword == "" {
			return errors.New("ADMIN_EMAIL and ADMIN_PASSWORD are required to create the first admin")
		}
		hash, err := HashPassword(s.seed.SeedPassword)
		if err != nil {
			return err
		}
		if _, err := s.repos.Admins.Create(ctx, s.seed.SeedEmail, s.seed.SeedName, hash, "owner"); err != nil {
			return err
		}
		s.log.Info("seed admin created", "email", s.seed.SeedEmail)
		s.defaultPassword.Store(true)
		return nil
	}
	admin, err := s.repos.Admins.ByEmail(ctx, s.seed.SeedEmail)
	if errors.Is(err, domain.ErrNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	same, _ := VerifyPassword(admin.PasswordHash, s.seed.SeedPassword)
	s.defaultPassword.Store(same)
	return nil
}

// Login verifies credentials and opens a new session.
func (s *Service) Login(ctx context.Context, req domain.LoginRequest, userAgent, ip string) (LoginResult, error) {
	email := strings.TrimSpace(req.Email)
	f := domain.Fields{}
	if email == "" {
		f.Add("email", "Укажите e-mail")
	}
	if req.Password == "" {
		f.Add("password", "Укажите пароль")
	}
	if err := f.Err(); err != nil {
		return LoginResult{}, err
	}
	if wait := s.throttle.retryAfter(email); wait > 0 {
		return LoginResult{}, &domain.RateLimitedError{Message: RetryMessage(wait)}
	}

	admin, err := s.repos.Admins.ByEmail(ctx, email)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return LoginResult{}, err
	}
	ok := false
	if err == nil {
		ok, _ = VerifyPassword(admin.PasswordHash, req.Password)
	}
	if !ok {
		s.throttle.fail(email)
		return LoginResult{}, &domain.ValidationError{Message: "Неверный e-mail или пароль", Fields: map[string]string{"password": "Неверный e-mail или пароль"}}
	}
	s.throttle.reset(email)
	if strings.EqualFold(admin.Email, s.seed.SeedEmail) {
		s.defaultPassword.Store(req.Password == s.seed.SeedPassword)
	}
	if err := s.repos.Admins.TouchLogin(ctx, admin.ID); err != nil {
		return LoginResult{}, err
	}
	now := time.Now()
	admin.LastLoginAt = &now
	return s.openSession(ctx, admin, userAgent, ip)
}

func (s *Service) openSession(ctx context.Context, admin domain.Admin, userAgent, ip string) (LoginResult, error) {
	token, hash, err := newRefreshToken()
	if err != nil {
		return LoginResult{}, err
	}
	now := time.Now()
	session, err := s.repos.Sessions.Create(ctx, admin.ID, hash, truncate(userAgent, 300), truncate(ip, 64), now.Add(s.refreshTTL))
	if err != nil {
		return LoginResult{}, err
	}
	access, err := s.signAccessToken(admin.ID, session.ID, now)
	if err != nil {
		return LoginResult{}, err
	}
	return LoginResult{
		Response:     domain.LoginResponse{AccessToken: access, ExpiresIn: int(s.accessTTL.Seconds()), User: admin.AdminUser},
		RefreshToken: token,
	}, nil
}

// Refresh rotates the refresh token: the presented session is revoked and a new one is created.
func (s *Service) Refresh(ctx context.Context, refreshToken, userAgent, ip string) (LoginResult, error) {
	if refreshToken == "" {
		return LoginResult{}, domain.ErrUnauthorized
	}
	session, err := s.repos.Sessions.ActiveByTokenHash(ctx, hashToken(refreshToken))
	if errors.Is(err, domain.ErrNotFound) {
		return LoginResult{}, domain.ErrUnauthorized
	}
	if err != nil {
		return LoginResult{}, err
	}
	admin, err := s.repos.Admins.ByID(ctx, session.AdminID)
	if errors.Is(err, domain.ErrNotFound) {
		return LoginResult{}, domain.ErrUnauthorized
	}
	if err != nil {
		return LoginResult{}, err
	}
	if err := s.repos.Sessions.Revoke(ctx, session.ID); err != nil {
		return LoginResult{}, err
	}
	return s.openSession(ctx, admin, userAgent, ip)
}

// Logout revokes the session behind the refresh token (idempotent).
func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	session, err := s.repos.Sessions.ActiveByTokenHash(ctx, hashToken(refreshToken))
	if errors.Is(err, domain.ErrNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	return s.repos.Sessions.Revoke(ctx, session.ID)
}

// Authenticate validates an access token and checks that its session is still active.
func (s *Service) Authenticate(ctx context.Context, accessToken string) (domain.Admin, Claims, error) {
	claims, err := s.ParseAccessToken(accessToken)
	if err != nil {
		return domain.Admin{}, Claims{}, domain.ErrUnauthorized
	}
	active, err := s.repos.Sessions.IsActive(ctx, claims.SessionID)
	if err != nil {
		return domain.Admin{}, Claims{}, err
	}
	if !active {
		return domain.Admin{}, Claims{}, domain.ErrUnauthorized
	}
	admin, err := s.repos.Admins.ByID(ctx, claims.AdminID)
	if errors.Is(err, domain.ErrNotFound) {
		return domain.Admin{}, Claims{}, domain.ErrUnauthorized
	}
	if err != nil {
		return domain.Admin{}, Claims{}, err
	}
	return admin, claims, nil
}

// UpdateProfile changes name and/or e-mail.
func (s *Service) UpdateProfile(ctx context.Context, admin domain.Admin, req domain.UpdateProfileRequest) (domain.AdminUser, error) {
	name, email := admin.Name, admin.Email
	f := domain.Fields{}
	if req.Name != nil {
		name = strings.TrimSpace(*req.Name)
		if name == "" {
			f.Add("name", "Укажите имя")
		}
		if len([]rune(name)) > 100 {
			f.Add("name", "Слишком длинное имя")
		}
	}
	if req.Email != nil {
		email = strings.ToLower(strings.TrimSpace(*req.Email))
		if !looksLikeEmail(email) {
			f.Add("email", "Укажите корректный e-mail")
		}
	}
	if err := f.Err(); err != nil {
		return domain.AdminUser{}, err
	}
	updated, err := s.repos.Admins.UpdateProfile(ctx, admin.ID, name, email)
	if err != nil {
		var conflict *domain.ConflictError
		if errors.As(err, &conflict) {
			return domain.AdminUser{}, domain.NewValidation("email", "Этот e-mail уже используется")
		}
		return domain.AdminUser{}, err
	}
	return updated.AdminUser, nil
}

// ChangePassword verifies the current password, stores the new hash and revokes other sessions.
func (s *Service) ChangePassword(ctx context.Context, admin domain.Admin, currentSessionID string, req domain.ChangePasswordRequest) error {
	f := domain.Fields{}
	if req.CurrentPassword == "" {
		f.Add("currentPassword", "Укажите текущий пароль")
	}
	if len(req.NewPassword) < 8 {
		f.Add("newPassword", "Пароль должен содержать не менее 8 символов")
	} else if len(req.NewPassword) > 128 {
		f.Add("newPassword", "Слишком длинный пароль")
	}
	if err := f.Err(); err != nil {
		return err
	}
	ok, _ := VerifyPassword(admin.PasswordHash, req.CurrentPassword)
	if !ok {
		return domain.NewValidation("currentPassword", "Неверный текущий пароль")
	}
	if req.NewPassword == req.CurrentPassword {
		return domain.NewValidation("newPassword", "Новый пароль совпадает с текущим")
	}
	hash, err := HashPassword(req.NewPassword)
	if err != nil {
		return err
	}
	if err := s.repos.Admins.UpdatePassword(ctx, admin.ID, hash); err != nil {
		return err
	}
	if strings.EqualFold(admin.Email, s.seed.SeedEmail) {
		s.defaultPassword.Store(req.NewPassword == s.seed.SeedPassword)
	}
	return s.repos.Sessions.RevokeOthers(ctx, admin.ID, currentSessionID)
}

// Sessions lists the admin's active sessions, flagging the current one.
func (s *Service) Sessions(ctx context.Context, adminID, currentSessionID string) ([]domain.AdminSession, error) {
	rows, err := s.repos.Sessions.ListActive(ctx, adminID)
	if err != nil {
		return nil, err
	}
	out := make([]domain.AdminSession, 0, len(rows))
	for _, r := range rows {
		out = append(out, domain.AdminSession{ID: r.ID, UserAgent: r.UserAgent, IP: r.IP, CreatedAt: r.CreatedAt, ExpiresAt: r.ExpiresAt, Current: r.ID == currentSessionID})
	}
	return out, nil
}

// RevokeSession revokes one of the admin's sessions.
func (s *Service) RevokeSession(ctx context.Context, adminID, sessionID string) error {
	if !domain.IsUUID(sessionID) {
		return domain.ErrNotFound
	}
	return s.repos.Sessions.RevokeOwned(ctx, adminID, sessionID)
}

func looksLikeEmail(v string) bool {
	at := strings.Index(v, "@")
	return at > 0 && at < len(v)-1 && !strings.ContainsAny(v, " \t\n") && strings.Contains(v[at:], ".")
}

func truncate(v string, n int) string {
	if len(v) <= n {
		return v
	}
	return v[:n]
}

// String implements fmt.Stringer for logging without secrets.
func (o Options) String() string {
	return fmt.Sprintf("auth{accessTTL=%s refreshTTL=%s}", o.AccessTTL, o.RefreshTTL)
}
