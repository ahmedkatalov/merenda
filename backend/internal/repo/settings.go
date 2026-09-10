package repo

import (
	"context"
	"encoding/json"

	"merenda/backend/internal/domain"
)

// Settings persists the typed key/value settings table.
type Settings struct{ q Querier }

// All returns every stored setting as raw JSON keyed by name.
func (r *Settings) All(ctx context.Context) (domain.RawSettings, error) {
	rows, err := r.q.Query(ctx, `SELECT key, value FROM settings`)
	if err != nil {
		return nil, wrap("list settings", err)
	}
	defer rows.Close()
	out := domain.RawSettings{}
	for rows.Next() {
		var key string
		var value []byte
		if err := rows.Scan(&key, &value); err != nil {
			return nil, wrap("scan setting", err)
		}
		out[key] = json.RawMessage(value)
	}
	return out, wrap("list settings", rows.Err())
}

// Get returns the raw JSON for one key.
func (r *Settings) Get(ctx context.Context, key string) (json.RawMessage, error) {
	var value []byte
	err := r.q.QueryRow(ctx, `SELECT value FROM settings WHERE key = $1`, key).Scan(&value)
	if err != nil {
		return nil, wrap("get setting", err)
	}
	return json.RawMessage(value), nil
}

// Put upserts the JSON for a key.
func (r *Settings) Put(ctx context.Context, key string, value json.RawMessage) error {
	_, err := r.q.Exec(ctx, `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
		ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, key, []byte(value))
	return wrap("put setting", err)
}

// LatestUpdate returns the most recent settings change as YYYY-MM-DD (for the sitemap).
func (r *Settings) LatestUpdate(ctx context.Context) (*string, error) {
	var ts *string
	err := r.q.QueryRow(ctx, `SELECT to_char(max(updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD') FROM settings`).Scan(&ts)
	return ts, wrap("latest settings update", err)
}
