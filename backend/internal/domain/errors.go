package domain

import "errors"

// Sentinel errors mapped to HTTP status codes by the API layer.
var (
	ErrNotFound         = errors.New("not found")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrForbidden        = errors.New("forbidden")
	ErrPayloadTooLarge  = errors.New("payload too large")
	ErrUnsupportedMedia = errors.New("unsupported media type")
)

// ValidationError carries per-field messages (Russian, user-facing).
type ValidationError struct {
	Message string
	Fields  map[string]string
}

func (e *ValidationError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "validation error"
}

// NewValidation builds a validation error for a single field.
func NewValidation(field, message string) *ValidationError {
	return &ValidationError{Fields: map[string]string{field: message}}
}

// ConflictError signals a state conflict (409), e.g. deleting a locked section.
type ConflictError struct {
	Message string
}

func (e *ConflictError) Error() string { return e.Message }

// Conflict builds a ConflictError with the given user-facing message.
func Conflict(message string) error { return &ConflictError{Message: message} }

// RateLimitedError carries the user-facing message for a 429 response.
type RateLimitedError struct {
	Message string
}

func (e *RateLimitedError) Error() string { return e.Message }

// Fields is a small helper for accumulating validation messages.
type Fields map[string]string

// Add records a message for a field (first message wins).
func (f Fields) Add(field, message string) {
	if _, ok := f[field]; !ok {
		f[field] = message
	}
}

// Err returns a ValidationError when any field has a message, nil otherwise.
func (f Fields) Err() error {
	if len(f) == 0 {
		return nil
	}
	return &ValidationError{Message: "Проверьте правильность заполнения полей", Fields: f}
}
