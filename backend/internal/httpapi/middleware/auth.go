package middleware

import (
	"errors"
	"net/http"
	"strings"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/reqctx"
	"merenda/backend/internal/httpapi/respond"
	"merenda/backend/internal/service/auth"
)

// Auth requires a valid `Authorization: Bearer <access token>` whose session is
// still active, and stores the admin in the request context.
func Auth(svc *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := bearerToken(r.Header.Get("Authorization"))
			if token == "" {
				w.Header().Set("WWW-Authenticate", `Bearer realm="merenda-admin"`)
				respond.Error(r.Context(), w, domain.ErrUnauthorized)
				return
			}
			admin, claims, err := svc.Authenticate(r.Context(), token)
			if err != nil {
				if errors.Is(err, domain.ErrUnauthorized) {
					w.Header().Set("WWW-Authenticate", `Bearer realm="merenda-admin", error="invalid_token"`)
				}
				respond.Error(r.Context(), w, err)
				return
			}
			ctx := reqctx.WithPrincipal(r.Context(), reqctx.Principal{Admin: admin, Claims: claims})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearerToken(header string) string {
	const prefix = "bearer "
	if len(header) <= len(prefix) || !strings.EqualFold(header[:len(prefix)], prefix) {
		return ""
	}
	return strings.TrimSpace(header[len(prefix):])
}
