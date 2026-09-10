package domain

import "encoding/json"

// Optional distinguishes "key absent" from "key present" (including explicit null)
// in PATCH payloads. Valid is true whenever the key was present in the JSON;
// for nullable fields use a pointer T so that null yields Valid=true, Value=nil.
type Optional[T any] struct {
	Valid bool
	Value T
}

// UnmarshalJSON is only invoked when the key is present.
func (o *Optional[T]) UnmarshalJSON(b []byte) error {
	o.Valid = true
	if string(b) == "null" {
		var zero T
		o.Value = zero
		return nil
	}
	return json.Unmarshal(b, &o.Value)
}

// MarshalJSON writes the wrapped value (null when not set).
func (o Optional[T]) MarshalJSON() ([]byte, error) {
	if !o.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(o.Value)
}

// Some builds a set Optional.
func Some[T any](v T) Optional[T] { return Optional[T]{Valid: true, Value: v} }
