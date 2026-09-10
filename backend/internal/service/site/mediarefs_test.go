package site

import (
	"encoding/json"
	"testing"
)

func TestCollectUUIDs(t *testing.T) {
	raw := json.RawMessage(`{
		"imageId": "11111111-0000-4000-8000-000000000001",
		"gifId": null,
		"title": "not-a-uuid",
		"items": [
			{"id": "p1", "imageId": "11111111-0000-4000-8000-000000000002"},
			{"nested": {"deep": ["11111111-0000-4000-8000-000000000003", 42, true]}}
		],
		"mediaIds": ["11111111-0000-4000-8000-000000000004", "garbage"]
	}`)
	got := map[string]struct{}{}
	collectUUIDs(raw, got)
	want := []string{
		"11111111-0000-4000-8000-000000000001",
		"11111111-0000-4000-8000-000000000002",
		"11111111-0000-4000-8000-000000000003",
		"11111111-0000-4000-8000-000000000004",
	}
	if len(got) != len(want) {
		t.Fatalf("got %d ids, want %d: %v", len(got), len(want), got)
	}
	for _, id := range want {
		if _, ok := got[id]; !ok {
			t.Errorf("missing %s", id)
		}
	}
	collectUUIDs(json.RawMessage(`not json`), got)
	collectUUIDs(nil, got)
	if len(got) != len(want) {
		t.Error("invalid input must not change the set")
	}
}
