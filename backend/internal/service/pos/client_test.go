package pos

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
)

func discardLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func TestSendDeliversPayloadWithHeaderKey(t *testing.T) {
	var got Order
	var gotKey, gotCT string
	var calls int32

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		gotKey = r.Header.Get("X-Order-Key")
		gotCT = r.Header.Get("Content-Type")
		_ = json.NewDecoder(r.Body).Decode(&got)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"received","id":123}`))
	}))
	defer srv.Close()

	c := New(srv.URL, "ok_secret", discardLogger())
	if !c.Enabled() {
		t.Fatal("client should be enabled with a key")
	}
	c.Send(context.Background(), Order{
		ExternalID: "merenda-abc",
		Source:     "site",
		Total:      850,
		Items:      []Item{{Name: "Эспрессо", Price: 200, Qty: 2}, {Name: "Пинца", Price: 450, Qty: 1}},
	})

	if calls != 1 {
		t.Fatalf("expected exactly 1 call, got %d", calls)
	}
	if gotKey != "ok_secret" {
		t.Fatalf("expected X-Order-Key header, got %q", gotKey)
	}
	if gotCT != "application/json" {
		t.Fatalf("expected application/json, got %q", gotCT)
	}
	if got.ExternalID != "merenda-abc" || got.Source != "site" || got.Total != 850 {
		t.Fatalf("unexpected payload: %+v", got)
	}
	if len(got.Items) != 2 || got.Items[0].Name != "Эспрессо" || got.Items[0].Price != 200 || got.Items[0].Qty != 2 {
		t.Fatalf("unexpected items: %+v", got.Items)
	}
}

func TestSendDoesNotRetryOnUnauthorized(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"Неверный ключ приёма заказов"}`))
	}))
	defer srv.Close()

	New(srv.URL, "ok_bad", discardLogger()).Send(context.Background(), Order{
		ExternalID: "merenda-x", Items: []Item{{Name: "X", Price: 1, Qty: 1}},
	})
	if calls != 1 {
		t.Fatalf("401 must not be retried; got %d calls", calls)
	}
}

func TestDisabledClientDoesNothing(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
	}))
	defer srv.Close()

	c := New(srv.URL, "", discardLogger())
	if c.Enabled() {
		t.Fatal("client with empty key must be disabled")
	}
	c.Send(context.Background(), Order{ExternalID: "y"})
	if calls != 0 {
		t.Fatalf("disabled client must not call the endpoint; got %d", calls)
	}
}
