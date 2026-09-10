package handlers

import (
	"errors"
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
)

const (
	// multipartMemory is how much of a multipart body is kept in memory before spilling to temp files.
	multipartMemory = 4 << 20
	// MultipartOverhead is the allowance for form fields and boundaries on top of MAX_UPLOAD_MB.
	MultipartOverhead = 1 << 20
)

// ListMedia returns a page of media.
func (h *Handlers) ListMedia(w http.ResponseWriter, r *http.Request) {
	q := domain.MediaQuery{Kind: query(r, "kind"), Q: query(r, "q"), Page: queryInt(r, "page", 1), PerPage: queryInt(r, "perPage", 24)}
	out, err := h.Media.List(r.Context(), q)
	result(w, r, http.StatusOK, out, err)
}

// UploadMedia accepts multipart `file` (+ optional `alt`).
func (h *Handlers) UploadMedia(w http.ResponseWriter, r *http.Request) {
	limit := h.Media.MaxBytes() + MultipartOverhead
	if r.ContentLength > limit {
		respond.Error(r.Context(), w, domain.ErrPayloadTooLarge)
		return
	}
	if err := r.ParseMultipartForm(multipartMemory); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) || r.ContentLength > limit {
			respond.Error(r.Context(), w, domain.ErrPayloadTooLarge)
			return
		}
		respond.Validation(w, "Ожидается multipart/form-data с полем file", map[string]string{"file": "Выберите файл"})
		return
	}
	defer func() {
		if r.MultipartForm != nil {
			_ = r.MultipartForm.RemoveAll()
		}
	}()
	file, header, err := r.FormFile("file")
	if err != nil {
		respond.Validation(w, "", map[string]string{"file": "Выберите файл"})
		return
	}
	defer file.Close()
	out, err := h.Media.Upload(r.Context(), file, header.Filename, r.FormValue("alt"))
	result(w, r, http.StatusCreated, out, err)
}

// UpdateMedia changes the alt text.
func (h *Handlers) UpdateMedia(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Alt string `json:"alt"`
	}
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Media.UpdateAlt(r.Context(), param(r, "id"), in.Alt)
	result(w, r, http.StatusOK, out, err)
}

// DeleteMedia removes a file and its row.
func (h *Handlers) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Media.Delete(r.Context(), param(r, "id")))
}
