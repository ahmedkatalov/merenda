package handlers

import (
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
)

// DashboardStats returns DashboardStats.
func (h *Handlers) DashboardStats(w http.ResponseWriter, r *http.Request) {
	out, err := h.Dashboard.Stats(r.Context())
	result(w, r, http.StatusOK, out, err)
}

/* ---- menus ---- */

// ListMenus returns all menus.
func (h *Handlers) ListMenus(w http.ResponseWriter, r *http.Request) {
	out, err := h.Catalog.ListMenus(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// CreateMenu adds a menu.
func (h *Handlers) CreateMenu(w http.ResponseWriter, r *http.Request) {
	var in domain.MenuInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.CreateMenu(r.Context(), in)
	result(w, r, http.StatusCreated, out, err)
}

// UpdateMenu patches a menu.
func (h *Handlers) UpdateMenu(w http.ResponseWriter, r *http.Request) {
	var in domain.MenuInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.UpdateMenu(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusOK, out, err)
}

// DeleteMenu removes a menu.
func (h *Handlers) DeleteMenu(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Catalog.DeleteMenu(r.Context(), param(r, "id")))
}

// ReorderMenus applies a new order.
func (h *Handlers) ReorderMenus(w http.ResponseWriter, r *http.Request) {
	reorderRequest(w, r, func(ids []string) error { return h.Catalog.ReorderMenus(r.Context(), ids) })
}

/* ---- categories ---- */

// ListCategories returns categories, optionally filtered by menuId.
func (h *Handlers) ListCategories(w http.ResponseWriter, r *http.Request) {
	out, err := h.Catalog.ListCategories(r.Context(), query(r, "menuId"))
	result(w, r, http.StatusOK, out, err)
}

// CreateCategory adds a category.
func (h *Handlers) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var in domain.CategoryInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.CreateCategory(r.Context(), in)
	result(w, r, http.StatusCreated, out, err)
}

// UpdateCategory patches a category.
func (h *Handlers) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	var in domain.CategoryInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.UpdateCategory(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusOK, out, err)
}

// DeleteCategory removes a category.
func (h *Handlers) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Catalog.DeleteCategory(r.Context(), param(r, "id")))
}

// ReorderCategories applies a new order.
func (h *Handlers) ReorderCategories(w http.ResponseWriter, r *http.Request) {
	reorderRequest(w, r, func(ids []string) error { return h.Catalog.ReorderCategories(r.Context(), ids) })
}

/* ---- products ---- */

// ListProducts returns the admin list view.
func (h *Handlers) ListProducts(w http.ResponseWriter, r *http.Request) {
	q := domain.ProductQuery{MenuID: query(r, "menuId"), CategoryID: query(r, "categoryId"), Availability: query(r, "availability"), Q: query(r, "q")}
	out, err := h.Catalog.ListProducts(r.Context(), q)
	result(w, r, http.StatusOK, out, err)
}

// GetProduct returns one product.
func (h *Handlers) GetProduct(w http.ResponseWriter, r *http.Request) {
	out, err := h.Catalog.GetProduct(r.Context(), param(r, "id"))
	result(w, r, http.StatusOK, out, err)
}

// CreateProduct adds a product.
func (h *Handlers) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var in domain.ProductInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.CreateProduct(r.Context(), in)
	result(w, r, http.StatusCreated, out, err)
}

// UpdateProduct patches a product.
func (h *Handlers) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	var in domain.ProductInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.UpdateProduct(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusOK, out, err)
}

// SetProductAvailability changes availability only.
func (h *Handlers) SetProductAvailability(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Availability domain.Availability `json:"availability"`
	}
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Catalog.SetAvailability(r.Context(), param(r, "id"), in.Availability)
	result(w, r, http.StatusOK, out, err)
}

// DeleteProduct removes a product.
func (h *Handlers) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Catalog.DeleteProduct(r.Context(), param(r, "id")))
}

// ReorderProducts applies a new order.
func (h *Handlers) ReorderProducts(w http.ResponseWriter, r *http.Request) {
	reorderRequest(w, r, func(ids []string) error { return h.Catalog.ReorderProducts(r.Context(), ids) })
}
