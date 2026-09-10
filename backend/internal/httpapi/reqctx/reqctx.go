// Package reqctx holds the request-scoped values shared by middleware and handlers
// (request id, logger, authenticated admin). Keeping them here avoids import cycles
// between the middleware and respond packages.
package reqctx

import (
	"context"
	"log/slog"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/service/auth"
)

type ctxKey int

const (
	keyRequestID ctxKey = iota
	keyLogger
	keyPrincipal
)

// Principal is the authenticated admin of the current request.
type Principal struct {
	Admin  domain.Admin
	Claims auth.Claims
}

// WithRequestID stores the request id.
func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, keyRequestID, id)
}

// RequestID returns the request id or "".
func RequestID(ctx context.Context) string {
	id, _ := ctx.Value(keyRequestID).(string)
	return id
}

// WithLogger stores a request-scoped logger.
func WithLogger(ctx context.Context, log *slog.Logger) context.Context {
	return context.WithValue(ctx, keyLogger, log)
}

// Logger returns the request logger, falling back to slog.Default.
func Logger(ctx context.Context) *slog.Logger {
	if log, ok := ctx.Value(keyLogger).(*slog.Logger); ok && log != nil {
		return log
	}
	return slog.Default()
}

// WithPrincipal stores the authenticated admin.
func WithPrincipal(ctx context.Context, p Principal) context.Context {
	return context.WithValue(ctx, keyPrincipal, p)
}

// PrincipalFrom returns the authenticated admin, ok=false on public routes.
func PrincipalFrom(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(keyPrincipal).(Principal)
	return p, ok
}
