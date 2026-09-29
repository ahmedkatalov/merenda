// Package pos delivers completed site orders to the Okvion Sales POS.
//
// It is strictly additive and best-effort: the caller saves the order locally
// first (admin + WhatsApp) and then fires Send in a goroutine with a background
// context, so a POS outage never affects the customer-facing order flow. The
// reception key lives only on the server (env OKVION_ORDER_KEY) and is sent in
// the X-Order-Key header — never in the page or the repository.
package pos

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// DefaultURL is the Okvion public order-intake endpoint.
const DefaultURL = "https://okvionsales.ru/api/public/orders"

// Item is one order line for the POS (price is per unit, in whole currency units).
type Item struct {
	Name  string `json:"name"`
	Price int64  `json:"price"`
	Qty   int    `json:"qty"`
}

// Order is the POS intake payload (the key travels in a header, not here).
type Order struct {
	ExternalID    string `json:"externalId"`
	CustomerName  string `json:"customerName,omitempty"`
	CustomerPhone string `json:"customerPhone,omitempty"`
	Address       string `json:"address,omitempty"`
	Comment       string `json:"comment,omitempty"`
	Source        string `json:"source"`
	Total         int64  `json:"total"`
	Items         []Item `json:"items"`
}

// Client posts orders to the POS. A zero key disables it (Enabled reports false).
type Client struct {
	url  string
	key  string
	http *http.Client
	log  *slog.Logger
}

// New builds a client. An empty url falls back to DefaultURL; an empty key
// disables delivery.
func New(url, key string, log *slog.Logger) *Client {
	if url == "" {
		url = DefaultURL
	}
	return &Client{url: url, key: key, http: &http.Client{Timeout: 12 * time.Second}, log: log}
}

// Enabled reports whether a reception key is configured.
func (c *Client) Enabled() bool { return c != nil && c.key != "" }

// Send posts the order with a couple of retries. It never returns an error and
// never blocks the request: run it in a goroutine with context.Background().
// Idempotency is handled by the POS via ExternalID, so retries can't duplicate.
func (c *Client) Send(ctx context.Context, o Order) {
	if !c.Enabled() {
		return
	}
	body, err := json.Marshal(o)
	if err != nil {
		c.log.Error("okvion: marshal order", "err", err, "externalId", o.ExternalID)
		return
	}
	const attempts = 3
	for attempt := 1; attempt <= attempts; attempt++ {
		status, resp, err := c.post(ctx, body)
		switch {
		case err == nil && status == http.StatusOK:
			c.log.Info("okvion: order delivered", "externalId", o.ExternalID, "resp", resp)
			return
		case status == http.StatusBadRequest || status == http.StatusUnauthorized:
			// Client-side problem (bad key / bad body) — retrying won't help.
			c.log.Error("okvion: order rejected", "status", status, "externalId", o.ExternalID, "resp", resp)
			return
		default:
			c.log.Warn("okvion: delivery failed, will retry", "attempt", attempt, "status", status, "err", err, "externalId", o.ExternalID)
		}
		if attempt < attempts {
			select {
			case <-ctx.Done():
				return
			case <-time.After(time.Duration(attempt) * 2 * time.Second):
			}
		}
	}
	c.log.Error("okvion: order not delivered after retries", "externalId", o.ExternalID)
}

func (c *Client) post(ctx context.Context, body []byte) (int, string, error) {
	reqCtx, cancel := context.WithTimeout(ctx, 12*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, c.url, bytes.NewReader(body))
	if err != nil {
		return 0, "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Order-Key", c.key)
	resp, err := c.http.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()
	snippet, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
	return resp.StatusCode, string(snippet), nil
}
