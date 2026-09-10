// Command server runs the Merenda REST API: config → db → migrations → seed admin → HTTP.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"merenda/backend/internal/config"
	"merenda/backend/internal/db"
	"merenda/backend/internal/httpapi"
	"merenda/backend/internal/httpapi/handlers"
	"merenda/backend/internal/migrations"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/auth"
	"merenda/backend/internal/service/catalog"
	"merenda/backend/internal/service/dashboard"
	"merenda/backend/internal/service/media"
	"merenda/backend/internal/service/orders"
	"merenda/backend/internal/service/schedules"
	"merenda/backend/internal/service/sections"
	"merenda/backend/internal/service/settings"
	"merenda/backend/internal/service/site"
	"merenda/backend/internal/storage"
)

const (
	shutdownTimeout  = 15 * time.Second
	housekeepingTick = time.Hour
)

func main() {
	if err := run(); err != nil {
		slog.Error("server exited", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}
	log := newLogger(cfg)
	slog.SetDefault(log)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool, migrations.FS, log); err != nil {
		return err
	}

	store, err := storage.NewLocal(cfg.UploadDir, "/uploads")
	if err != nil {
		return err
	}
	repos := repo.New(pool, store.PublicURL)

	authSvc := auth.New(repos, log, auth.Options{
		Secret: cfg.JWTSecret, AccessTTL: cfg.AccessTokenTTL, RefreshTTL: cfg.RefreshTokenTTL,
		SeedEmail: cfg.AdminEmail, SeedPassword: cfg.AdminPassword, SeedName: cfg.AdminName,
	})
	if err := authSvc.EnsureSeedAdmin(ctx); err != nil {
		return fmt.Errorf("seed admin: %w", err)
	}
	if cfg.AdminPassword == config.DefaultAdminPassword && authSvc.DefaultPasswordInUse() {
		log.Warn("ADMIN_PASSWORD is still the placeholder from .env.example — change it in the admin («Безопасность») or via ADMIN_PASSWORD before going live")
	}

	settingsSvc := settings.New(repos)
	siteSvc := site.New(repos, settingsSvc, cfg.PublicSiteURL)
	deps := handlers.Deps{
		Cfg:       cfg,
		Log:       log,
		Repos:     repos,
		Auth:      authSvc,
		Catalog:   catalog.New(repos),
		Schedules: schedules.New(repos),
		Sections:  sections.New(repos),
		Settings:  settingsSvc,
		Orders:    orders.New(repos, settingsSvc),
		Media:     media.New(repos, store, cfg.MaxUploadBytes(), log),
		Site:      siteSvc,
		Dashboard: dashboard.New(repos, settingsSvc, siteSvc, authSvc),
	}

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           httpapi.New(deps, store.Handler()),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       2 * time.Minute,
		WriteTimeout:      2 * time.Minute,
		IdleTimeout:       2 * time.Minute,
		MaxHeaderBytes:    64 << 10,
	}

	go housekeeping(ctx, repos, log)

	errCh := make(chan error, 1)
	go func() {
		log.Info("listening", "addr", cfg.HTTPAddr, "env", cfg.AppEnv, "uploads", store.Root(),
			"publicSite", cfg.PublicSiteURL, "adminSite", cfg.AdminSiteURL)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	case <-ctx.Done():
		log.Info("shutdown requested")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("shutdown: %w", err)
		}
		log.Info("server stopped")
		return nil
	}
}

// housekeeping purges stale sessions periodically.
func housekeeping(ctx context.Context, repos *repo.Repos, log *slog.Logger) {
	ticker := time.NewTicker(housekeepingTick)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := repos.Sessions.DeleteExpired(ctx); err != nil && ctx.Err() == nil {
				log.Warn("delete expired sessions", "err", err)
			}
		}
	}
}

func newLogger(cfg config.Config) *slog.Logger {
	opts := &slog.HandlerOptions{Level: slog.LevelInfo}
	if cfg.IsProduction() {
		return slog.New(slog.NewJSONHandler(os.Stdout, opts))
	}
	return slog.New(slog.NewTextHandler(os.Stdout, opts))
}
