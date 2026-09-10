package handlers

import (
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
)

// ListOrders returns a page of orders.
func (h *Handlers) ListOrders(w http.ResponseWriter, r *http.Request) {
	q := domain.OrderQuery{Status: query(r, "status"), Type: query(r, "type"), Page: queryInt(r, "page", 1), PerPage: queryInt(r, "perPage", 20)}
	out, err := h.Orders.List(r.Context(), q)
	result(w, r, http.StatusOK, out, err)
}

// GetOrder returns one order.
func (h *Handlers) GetOrder(w http.ResponseWriter, r *http.Request) {
	out, err := h.Orders.Get(r.Context(), param(r, "id"))
	result(w, r, http.StatusOK, out, err)
}

// SetOrderStatus changes the status.
func (h *Handlers) SetOrderStatus(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Status domain.OrderStatus `json:"status"`
	}
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Orders.SetStatus(r.Context(), param(r, "id"), in.Status)
	result(w, r, http.StatusOK, out, err)
}

// DeleteOrder removes an order.
func (h *Handlers) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Orders.Delete(r.Context(), param(r, "id")))
}
