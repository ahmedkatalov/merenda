// Package handlers implements the HTTP endpoints of docs/API.md. Handlers only
// parse input, call a service and write the response; every rule lives in services.
package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"merenda/backend/internal/config"
	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/reqctx"
	"merenda/backend/internal/httpapi/respond"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/auth"
	"merenda/backend/internal/service/catalog"
	"merenda/backend/internal/service/dashboard"
	"merenda/backend/internal/service/media"
	"merenda/backend/internal/service/orders"
	"merenda/backend/internal/service/schedules"
	"merenda/backend/internal/service/sections"
	"merenda/backend/internal/service/settings"
	"merenda/backend/internal/service/site"
)

// Deps are the services the handlers delegate to.
type Deps struct {
	Cfg       config.Config
	Log       *slog.Logger
	Repos     *repo.Repos
	Auth      *auth.Service
	Catalog   *catalog.Service
	Schedules *schedules.Service
	Sections  *sections.Service
	Settings  *settings.Service
	Orders    *orders.Service
	Media     *media.Service
	Site      *site.Service
	Dashboard *dashboard.Service
}

// Handlers is the endpoint set.
type Handlers struct {
	Deps
}

// New creates the handlers.
func New(d Deps) *Handlers { return &Handlers{Deps: d} }

// decodeJSON reads the request body into dst, translating decode failures into
// validation errors (body size is enforced by the BodyLimit middleware).
func decodeJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return &domain.ValidationError{Message: "Пустой запрос"}
	}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(dst)
	if err == nil {
		return nil
	}
	var (
		maxErr  *http.MaxBytesError
		typeErr *json.UnmarshalTypeError
	)
	switch {
	case errors.Is(err, io.EOF):
		return &domain.ValidationError{Message: "Пустой запрос"}
	case errors.As(err, &maxErr):
		return err
	case errors.As(err, &typeErr):
		field := typeErr.Field
		if field == "" {
			field = "body"
		}
		return domain.NewValidation(field, "Неверный тип значения")
	default:
		return &domain.ValidationError{Message: "Некорректный JSON"}
	}
}

// readRawJSON returns the body as raw JSON after checking it is well-formed.
func readRawJSON(r *http.Request) (json.RawMessage, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	if len(body) == 0 {
		return nil, &domain.ValidationError{Message: "Пустой запрос"}
	}
	if !json.Valid(body) {
		return nil, &domain.ValidationError{Message: "Некорректный JSON"}
	}
	return json.RawMessage(body), nil
}

// param returns a path parameter.
func param(r *http.Request, name string) string { return strings.TrimSpace(chi.URLParam(r, name)) }

// queryInt parses an integer query parameter with a default.
func queryInt(r *http.Request, name string, def int) int {
	raw := strings.TrimSpace(r.URL.Query().Get(name))
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return n
}

// query returns a trimmed query parameter.
func query(r *http.Request, name string) string { return strings.TrimSpace(r.URL.Query().Get(name)) }

// principal returns the authenticated admin or writes 401.
func principal(w http.ResponseWriter, r *http.Request) (reqctx.Principal, bool) {
	p, ok := reqctx.PrincipalFrom(r.Context())
	if !ok {
		respond.Error(r.Context(), w, domain.ErrUnauthorized)
	}
	return p, ok
}

// reorderRequest decodes a ReorderRequest and runs fn, answering 204.
func reorderRequest(w http.ResponseWriter, r *http.Request, fn func(ids []string) error) {
	var req domain.ReorderRequest
	if err := decodeJSON(r, &req); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	if err := fn(req.IDs); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	respond.NoContent(w)
}

// result writes v or the error.
func result(w http.ResponseWriter, r *http.Request, status int, v any, err error) {
	if err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	respond.JSON(w, status, v)
}

// done writes 204 or the error.
func done(w http.ResponseWriter, r *http.Request, err error) {
	if err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	respond.NoContent(w)
}
