package handlers

import (
	"context"
	"net/http"
	"time"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
)

// Healthz reports process and database liveness.
func (h *Handlers) Healthz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	if err := h.Repos.Ping(ctx); err != nil {
		respond.JSON(w, http.StatusServiceUnavailable, map[string]any{"ok": false, "error": "database unavailable"})
		return
	}
	respond.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// SiteBootstrap returns SiteBootstrap.
func (h *Handlers) SiteBootstrap(w http.ResponseWriter, r *http.Request) {
	out, err := h.Site.Bootstrap(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// Menu returns PublicMenuResponse.
func (h *Handlers) Menu(w http.ResponseWriter, r *http.Request) {
	out, err := h.Site.Menu(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// Status returns SiteStatus.
func (h *Handlers) Status(w http.ResponseWriter, r *http.Request) {
	out, err := h.Site.Status(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// CreateOrder places an order and returns the WhatsApp hand-off.
func (h *Handlers) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateOrderRequest
	if err := decodeJSON(r, &req); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Orders.Create(r.Context(), req)
	result(w, r, http.StatusCreated, out, err)
}

// Robots serves robots.txt.
func (h *Handlers) Robots(w http.ResponseWriter, r *http.Request) {
	body, err := h.Site.Robots(r.Context())
	if err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	_, _ = w.Write([]byte(body))
}

// Sitemap serves sitemap.xml.
func (h *Handlers) Sitemap(w http.ResponseWriter, r *http.Request) {
	body, err := h.Site.Sitemap(r.Context())
	if err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	_, _ = w.Write([]byte(body))
}
