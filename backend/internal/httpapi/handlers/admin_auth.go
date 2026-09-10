package handlers

import (
	"errors"
	"net/http"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/httpapi/respond"
)

const (
	refreshCookieName = "merenda_refresh"
	refreshCookiePath = "/api/v1/admin/auth"
)

func (h *Handlers) setRefreshCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name: refreshCookieName, Value: token, Path: refreshCookiePath,
		HttpOnly: true, Secure: h.Cfg.CookieSecure, SameSite: http.SameSiteStrictMode,
		MaxAge: int(h.Auth.RefreshTTL().Seconds()),
	})
}

func (h *Handlers) clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name: refreshCookieName, Value: "", Path: refreshCookiePath,
		HttpOnly: true, Secure: h.Cfg.CookieSecure, SameSite: http.SameSiteStrictMode, MaxAge: -1,
	})
}

func refreshToken(r *http.Request) string {
	c, err := r.Cookie(refreshCookieName)
	if err != nil {
		return ""
	}
	return c.Value
}

// Login checks credentials, opens a session and sets the refresh cookie.
func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := decodeJSON(r, &req); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	res, err := h.Auth.Login(r.Context(), req, r.UserAgent(), r.RemoteAddr)
	if err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	h.setRefreshCookie(w, res.RefreshToken)
	respond.JSON(w, http.StatusOK, res.Response)
}

// Refresh rotates the refresh token and issues a new access token.
func (h *Handlers) Refresh(w http.ResponseWriter, r *http.Request) {
	res, err := h.Auth.Refresh(r.Context(), refreshToken(r), r.UserAgent(), r.RemoteAddr)
	if err != nil {
		if errors.Is(err, domain.ErrUnauthorized) {
			h.clearRefreshCookie(w)
		}
		respond.Error(r.Context(), w, err)
		return
	}
	h.setRefreshCookie(w, res.RefreshToken)
	respond.JSON(w, http.StatusOK, res.Response)
}

// Logout revokes the session behind the cookie and clears it.
func (h *Handlers) Logout(w http.ResponseWriter, r *http.Request) {
	err := h.Auth.Logout(r.Context(), refreshToken(r))
	h.clearRefreshCookie(w)
	done(w, r, err)
}

// Me returns the current admin.
func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	p, ok := principal(w, r)
	if !ok {
		return
	}
	respond.JSON(w, http.StatusOK, p.Admin.AdminUser)
}

// UpdateMe changes name/e-mail.
func (h *Handlers) UpdateMe(w http.ResponseWriter, r *http.Request) {
	p, ok := principal(w, r)
	if !ok {
		return
	}
	var req domain.UpdateProfileRequest
	if err := decodeJSON(r, &req); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	out, err := h.Auth.UpdateProfile(r.Context(), p.Admin, req)
	result(w, r, http.StatusOK, out, err)
}

// ChangePassword sets a new password and revokes other sessions.
func (h *Handlers) ChangePassword(w http.ResponseWriter, r *http.Request) {
	p, ok := principal(w, r)
	if !ok {
		return
	}
	var req domain.ChangePasswordRequest
	if err := decodeJSON(r, &req); err != nil {
		respond.Error(r.Context(), w, err)
		return
	}
	done(w, r, h.Auth.ChangePassword(r.Context(), p.Admin, p.Claims.SessionID, req))
}

// Sessions lists the admin's active sessions.
func (h *Handlers) Sessions(w http.ResponseWriter, r *http.Request) {
	p, ok := principal(w, r)
	if !ok {
		return
	}
	out, err := h.Auth.Sessions(r.Context(), p.Admin.ID, p.Claims.SessionID)
	result(w, r, http.StatusOK, out, err)
}

// RevokeSession revokes one session of the admin.
func (h *Handlers) RevokeSession(w http.ResponseWriter, r *http.Request) {
	p, ok := principal(w, r)
	if !ok {
		return
	}
	done(w, r, h.Auth.RevokeSession(r.Context(), p.Admin.ID, param(r, "id")))
}
