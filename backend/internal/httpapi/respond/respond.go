// Package respond writes JSON responses and maps domain errors to the API error shape
// `{ "error": { "code", "message", "fields"? } }` defined in docs/API.md.
package respond

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/reqctx"
)

// Error codes from the contract.
const (
	CodeValidation       = "validation_error"
	CodeUnauthorized     = "unauthorized"
	CodeForbidden        = "forbidden"
	CodeNotFound         = "not_found"
	CodeConflict         = "conflict"
	CodePayloadTooLarge  = "payload_too_large"
	CodeUnsupportedMedia = "unsupported_media"
	CodeRateLimited      = "rate_limited"
	CodeInternal         = "internal"
)

// ErrorBody is the JSON envelope of every error response.
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail mirrors `ApiError.error`.
type ErrorDetail struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

// JSON writes v with the given status.
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

// NoContent writes 204.
func NoContent(w http.ResponseWriter) { w.WriteHeader(http.StatusNoContent) }

// Fail writes an error envelope with an explicit status/code.
func Fail(w http.ResponseWriter, status int, code, message string) {
	JSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: message}})
}

// Validation writes a 400 with per-field messages.
func Validation(w http.ResponseWriter, message string, fields map[string]string) {
	if message == "" {
		message = "Проверьте правильность заполнения полей"
	}
	JSON(w, http.StatusBadRequest, ErrorBody{Error: ErrorDetail{Code: CodeValidation, Message: message, Fields: fields}})
}

// Error maps a domain error to the matching HTTP response. Unknown errors are
// logged with the request id and reported as 500 without leaking details.
func Error(ctx context.Context, w http.ResponseWriter, err error) {
	var (
		validation *domain.ValidationError
		conflict   *domain.ConflictError
		limited    *domain.RateLimitedError
		maxBytes   *http.MaxBytesError
	)
	switch {
	case errors.As(err, &validation):
		Validation(w, validation.Message, validation.Fields)
	case errors.Is(err, domain.ErrUnauthorized):
		Fail(w, http.StatusUnauthorized, CodeUnauthorized, "Требуется авторизация")
	case errors.Is(err, domain.ErrForbidden):
		Fail(w, http.StatusForbidden, CodeForbidden, "Недостаточно прав")
	case errors.Is(err, domain.ErrNotFound):
		Fail(w, http.StatusNotFound, CodeNotFound, "Не найдено")
	case errors.As(err, &conflict):
		Fail(w, http.StatusConflict, CodeConflict, conflict.Message)
	case errors.Is(err, domain.ErrPayloadTooLarge), errors.As(err, &maxBytes):
		Fail(w, http.StatusRequestEntityTooLarge, CodePayloadTooLarge, "Слишком большой запрос")
	case errors.Is(err, domain.ErrUnsupportedMedia):
		Fail(w, http.StatusUnsupportedMediaType, CodeUnsupportedMedia, "Неподдерживаемый формат файла")
	case errors.As(err, &limited):
		w.Header().Set("Retry-After", "60")
		Fail(w, http.StatusTooManyRequests, CodeRateLimited, limited.Message)
	case errors.Is(err, context.Canceled):
		// Client went away; nothing meaningful to write.
		Fail(w, 499, CodeInternal, "Запрос отменён")
	default:
		reqctx.Logger(ctx).Error("request failed", "err", err)
		Fail(w, http.StatusInternalServerError, CodeInternal, "Внутренняя ошибка сервера")
	}
}
