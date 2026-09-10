package handlers

import (
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
)

// ListSchedules returns every schedule, venue first.
func (h *Handlers) ListSchedules(w http.ResponseWriter, r *http.Request) {
	out, err := h.Schedules.List(r.Context())
	result(w, r, http.StatusOK, out, err)
}

// CreateSchedule adds a custom schedule.
func (h *Handlers) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	var in domain.ScheduleInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Schedules.Create(r.Context(), in)
	result(w, r, http.StatusCreated, out, err)
}

// UpdateSchedule renames a schedule / changes its key.
func (h *Handlers) UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	var in domain.ScheduleInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Schedules.Update(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusOK, out, err)
}

// PutScheduleHours replaces the 7 day rows.
func (h *Handlers) PutScheduleHours(w http.ResponseWriter, r *http.Request) {
	var in domain.ScheduleHoursInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Schedules.PutHours(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusOK, out, err)
}

// DeleteSchedule removes a custom schedule.
func (h *Handlers) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Schedules.Delete(r.Context(), param(r, "id")))
}

// UpsertScheduleException creates or replaces the exception for a date.
func (h *Handlers) UpsertScheduleException(w http.ResponseWriter, r *http.Request) {
	var in domain.ScheduleExceptionInput
	if err := decodeJSON(r, &in); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Schedules.UpsertException(r.Context(), param(r, "id"), in)
	result(w, r, http.StatusCreated, out, err)
}

// DeleteScheduleException removes an exception.
func (h *Handlers) DeleteScheduleException(w http.ResponseWriter, r *http.Request) {
	done(w, r, h.Schedules.DeleteException(r.Context(), param(r, "id"), param(r, "exceptionId")))
}
