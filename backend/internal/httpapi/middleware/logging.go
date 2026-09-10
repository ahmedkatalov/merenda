package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"

	chimw "github.com/go-chi/chi/v5/middleware"

	"merenda/backend/internal/httpapi/reqctx"
	"merenda/backend/internal/httpapi/respond"
)

// RequestID assigns a random id to every request, exposes it as X-Request-Id
// and stores it in the context.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := newRequestID()
		w.Header().Set("X-Request-Id", id)
		next.ServeHTTP(w, r.WithContext(reqctx.WithRequestID(r.Context(), id)))
	})
}

func newRequestID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "00000000"
	}
	return hex.EncodeToString(b[:])
}

// Logger attaches a request-scoped logger and writes one line per request.
func Logger(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			reqLog := log.With("requestId", reqctx.RequestID(r.Context()), "ip", r.RemoteAddr)
			ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r.WithContext(reqctx.WithLogger(r.Context(), reqLog)))
			level := slog.LevelInfo
			if r.URL.Path == "/healthz" || r.URL.Path == "/api/v1/healthz" {
				level = slog.LevelDebug
			}
			reqLog.Log(r.Context(), level, "http",
				"method", r.Method, "path", r.URL.Path, "status", ww.Status(),
				"bytes", ww.BytesWritten(), "duration", time.Since(start).String(),
				"userAgent", r.UserAgent())
		})
	}
}

// Recover converts panics into a 500 JSON response and logs the stack.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				if rec == http.ErrAbortHandler {
					panic(rec)
				}
				reqctx.Logger(r.Context()).Error("panic recovered", "panic", rec, "stack", string(debug.Stack()))
				respond.Fail(w, http.StatusInternalServerError, respond.CodeInternal, "Внутренняя ошибка сервера")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
