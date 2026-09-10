package site

import (
	"encoding/json"

	"merenda/backend/internal/domain"
)

// collectUUIDs walks arbitrary JSON and records every string value that looks
// like a UUID (section settings reference media by id in nested objects/arrays).
func collectUUIDs(raw json.RawMessage, into map[string]struct{}) {
	if len(raw) == 0 {
		return
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return
	}
	walk(v, into)
}

func walk(v any, into map[string]struct{}) {
	switch t := v.(type) {
	case string:
		if domain.IsUUID(t) {
			into[t] = struct{}{}
		}
	case []any:
		for _, item := range t {
			walk(item, into)
		}
	case map[string]any:
		for _, item := range t {
			walk(item, into)
		}
	}
}

func addRef(into map[string]struct{}, id *string) {
	if id != nil && domain.IsUUID(*id) {
		into[*id] = struct{}{}
	}
}
