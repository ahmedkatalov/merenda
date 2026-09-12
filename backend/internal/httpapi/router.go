// Package httpapi wires middleware and handlers into the chi router.
package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"merenda/backend/internal/httpapi/handlers"
	"merenda/backend/internal/httpapi/middleware"
	"merenda/backend/internal/httpapi/respond"
)

const (
	jsonBodyLimit = 1 << 20 // 1 MB for JSON payloads

	loginPerMinute  = 5
	orderPerMinute  = 10
	adminPerMinute  = 300
	corsPreflight   = 300
	uploadsPrefix   = "/uploads"
	apiPrefix       = "/api/v1"
	adminPathPrefix = "/admin"
)

// New builds the HTTP handler. uploads serves files below UPLOAD_DIR.
func New(d handlers.Deps, uploads http.Handler) http.Handler {
	h := handlers.New(d)
	r := chi.NewRouter()

	r.Use(middleware.RealIP(d.Cfg.TrustProxy))
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger(d.Log))
	r.Use(middleware.Recover)
	r.Use(middleware.SecureHeaders)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{d.Cfg.PublicSiteURL, d.Cfg.AdminSiteURL},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"X-Request-Id", "Retry-After"},
		AllowCredentials: true,
		MaxAge:           corsPreflight,
	}))
	r.NotFound(notFound)
	r.MethodNotAllowed(methodNotAllowed)

	r.Get("/healthz", h.Healthz)
	r.Get("/robots.txt", h.Robots)
	r.Get("/sitemap.xml", h.Sitemap)
	r.Handle(uploadsPrefix+"/*", http.StripPrefix(uploadsPrefix, uploads))

	r.Route(apiPrefix, func(r chi.Router) {
		r.Use(middleware.NoStore)
		r.Get("/healthz", h.Healthz)

		// Public
		r.Group(func(r chi.Router) {
			r.Use(middleware.BodyLimit(jsonBodyLimit))
			r.Get("/site", h.SiteBootstrap)
			r.Get("/menu", h.Menu)
			r.Get("/status", h.Status)
			r.With(middleware.RateLimit(orderPerMinute)).Post("/orders", h.CreateOrder)
		})

		// Admin
		r.Route(adminPathPrefix, func(r chi.Router) {
			r.Use(middleware.RateLimit(adminPerMinute))

			r.Route("/auth", func(r chi.Router) {
				r.Use(middleware.BodyLimit(jsonBodyLimit))
				r.With(middleware.RateLimit(loginPerMinute)).Post("/login", h.Login)
				r.Post("/refresh", h.Refresh)
				r.Post("/logout", h.Logout)
				r.Group(func(r chi.Router) {
					r.Use(middleware.Auth(d.Auth))
					r.Get("/me", h.Me)
					r.Patch("/me", h.UpdateMe)
					r.Post("/password", h.ChangePassword)
					r.Get("/sessions", h.Sessions)
					r.Delete("/sessions/{id}", h.RevokeSession)
				})
			})

			r.Group(func(r chi.Router) {
				r.Use(middleware.Auth(d.Auth))

				// Multipart upload gets its own, larger body limit.
				r.With(middleware.BodyLimit(d.Media.MaxBytes()+handlers.MultipartOverhead)).Post("/media", h.UploadMedia)

				r.Group(func(r chi.Router) {
					r.Use(middleware.BodyLimit(jsonBodyLimit))

					r.Get("/dashboard", h.DashboardStats)

					r.Get("/menus", h.ListMenus)
					r.Post("/menus", h.CreateMenu)
					r.Put("/menus/reorder", h.ReorderMenus)
					r.Patch("/menus/{id}", h.UpdateMenu)
					r.Delete("/menus/{id}", h.DeleteMenu)

					r.Get("/categories", h.ListCategories)
					r.Post("/categories", h.CreateCategory)
					r.Put("/categories/reorder", h.ReorderCategories)
					r.Patch("/categories/{id}", h.UpdateCategory)
					r.Delete("/categories/{id}", h.DeleteCategory)

					r.Get("/products", h.ListProducts)
					r.Post("/products", h.CreateProduct)
					r.Put("/products/reorder", h.ReorderProducts)
					r.Get("/products/{id}", h.GetProduct)
					r.Patch("/products/{id}", h.UpdateProduct)
					r.Patch("/products/{id}/availability", h.SetProductAvailability)
					r.Delete("/products/{id}", h.DeleteProduct)

					r.Get("/media", h.ListMedia)
					r.Get("/media/{id}", h.GetMedia)
					r.Patch("/media/{id}", h.UpdateMedia)
					r.Delete("/media/{id}", h.DeleteMedia)

					r.Get("/orders", h.ListOrders)
					r.Get("/orders/{id}", h.GetOrder)
					r.Patch("/orders/{id}/status", h.SetOrderStatus)
					r.Delete("/orders/{id}", h.DeleteOrder)

					r.Get("/schedules", h.ListSchedules)
					r.Post("/schedules", h.CreateSchedule)
					r.Patch("/schedules/{id}", h.UpdateSchedule)
					r.Put("/schedules/{id}/hours", h.PutScheduleHours)
					r.Delete("/schedules/{id}", h.DeleteSchedule)
					r.Post("/schedules/{id}/exceptions", h.UpsertScheduleException)
					r.Delete("/schedules/{id}/exceptions/{exceptionId}", h.DeleteScheduleException)

					r.Get("/settings", h.GetSettings)
					r.Get("/settings/{key}", h.GetSetting)
					r.Put("/settings/{key}", h.PutSetting)
					r.Get("/theme/presets", h.ThemePresets)

					r.Get("/sections", h.ListSections)
					r.Post("/sections", h.CreateSection)
					r.Put("/sections/reorder", h.ReorderSections)
					r.Patch("/sections/{id}", h.PatchSection)
					r.Delete("/sections/{id}", h.DeleteSection)
				})
			})
		})
	})
	return r
}

func notFound(w http.ResponseWriter, _ *http.Request) {
	respond.Fail(w, http.StatusNotFound, respond.CodeNotFound, "Не найдено")
}

func methodNotAllowed(w http.ResponseWriter, _ *http.Request) {
	respond.Fail(w, http.StatusMethodNotAllowed, "method_not_allowed", "Метод не поддерживается")
}
