package handlers

import (
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
	"merenda/backend/internal/service/theme"
)

// GetSettings returns the whole SettingsMap.
func (h *Handlers) GetSettings(w http.ResponseWriter, r *http.Request) {
	out, err := h.Settings.Load(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// GetSetting returns one typed value.
func (h *Handlers) GetSetting(w http.ResponseWriter, r *http.Request) {
	out, err := h.Settings.Get(r.Context(), param(r, "key"))
	result(w, r, http.StatusOK, out, err)
}

// PutSetting validates and stores one key.
func (h *Handlers) PutSetting(w http.ResponseWriter, r *http.Request) {
	raw, err := readRawJSON(r)
	if err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Settings.Put(r.Context(), param(r, "key"), raw)
	result(w, r, http.StatusOK, out, err)
}

// ThemePresets returns the Go copy of THEME_PRESETS.
func (h *Handlers) ThemePresets(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, theme.Presets)
}

/* ---- sections ---- */

// ListSections returns all sections including disabled ones.
func (h *Handlers) ListSections(w http.ResponseWriter, r *http.Request) {
	out, err := h.Sections.List(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// CreateSection adds a section.
func (h *Handlers) CreateSection(w http.ResponseWriter, r *http.Request) {
	var in domain.SectionInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Sections.Create(r.Context(), in)
	result(w, r, http.StatusCreated, out, err)
}

// PatchSection updates title/enabled/settings.
func (h *Handlers) PatchSection(w http.ResponseWriter, r *http.Request) {
	var in domain.SectionPatch
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Sections.Patch(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusOK, out, err)
}

// DeleteSection removes a non-locked section.
func (h *Handlers) DeleteSection(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Sections.Delete(r.Context(), param(r, "id")))
}

// ReorderSections applies a new order (header first, footer last).
func (h *Handlers) ReorderSections(w http.ResponseWriter, r *http.Request) {
	reorderRequest(w, r, func(ids []string) error { return h.Sections.Reorder(r.Context(), ids) })
}
