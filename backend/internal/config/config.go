// Package config loads runtime configuration from environment variables,
// optionally seeded from a .env file in the backend dir or the repo root.
package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config is the fully resolved runtime configuration.
type Config struct {
	AppEnv          string
	HTTPAddr        string
	DatabaseURL     string
	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
	AdminEmail      string
	AdminPassword   string
	AdminName       string
	PublicSiteURL   string
	AdminSiteURL    string
	UploadDir       string
	MaxUploadMB     int64
	CookieSecure    bool
	// TrustProxy enables X-Forwarded-For / X-Real-IP for client IP detection.
	// Defaults to true in production (the API sits behind Caddy) and false otherwise.
	TrustProxy bool
}

// DefaultAdminPassword is the placeholder from .env.example; a warning is logged when it is in use.
const DefaultAdminPassword = "change-me-now"

// IsProduction reports whether APP_ENV=production.
func (c Config) IsProduction() bool { return c.AppEnv == "production" }

// MaxUploadBytes is MAX_UPLOAD_MB expressed in bytes.
func (c Config) MaxUploadBytes() int64 { return c.MaxUploadMB * 1024 * 1024 }

// Load reads .env files (without overriding existing variables) and parses the environment.
func Load() (Config, error) {
	loadDotEnv()

	cfg := Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		HTTPAddr:      getEnv("HTTP_ADDR", ":8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://merenda:merenda@localhost:5432/merenda?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", ""),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@merenda.ru"),
		AdminPassword: getEnv("ADMIN_PASSWORD", DefaultAdminPassword),
		AdminName:     getEnv("ADMIN_NAME", "Владелец"),
		PublicSiteURL: strings.TrimRight(getEnv("PUBLIC_SITE_URL", "http://localhost:5173"), "/"),
		AdminSiteURL:  strings.TrimRight(getEnv("ADMIN_SITE_URL", "http://localhost:5174"), "/"),
		UploadDir:     getEnv("UPLOAD_DIR", "./data/uploads"),
	}

	var err error
	if cfg.AccessTokenTTL, err = getDuration("ACCESS_TOKEN_TTL", 15*time.Minute); err != nil {
		return cfg, err
	}
	if cfg.RefreshTokenTTL, err = getDuration("REFRESH_TOKEN_TTL", 720*time.Hour); err != nil {
		return cfg, err
	}
	if cfg.MaxUploadMB, err = getInt("MAX_UPLOAD_MB", 10); err != nil {
		return cfg, err
	}
	if cfg.CookieSecure, err = getBool("COOKIE_SECURE", false); err != nil {
		return cfg, err
	}
	if cfg.TrustProxy, err = getBool("TRUST_PROXY", cfg.IsProduction()); err != nil {
		return cfg, err
	}

	if len(cfg.JWTSecret) < 16 {
		return cfg, fmt.Errorf("JWT_SECRET must be set to at least 16 characters")
	}
	if cfg.MaxUploadMB <= 0 {
		return cfg, fmt.Errorf("MAX_UPLOAD_MB must be positive")
	}
	return cfg, nil
}

// loadDotEnv loads the first .env found in the working dir, the backend dir or the repo root.
func loadDotEnv() {
	candidates := []string{".env", filepath.Join("..", ".env"), filepath.Join("..", "..", ".env")}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(exe), ".env"))
	}
	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			_ = godotenv.Load(path) // never overrides variables already set
			return
		}
	}
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}
	return def
}

func getDuration(key string, def time.Duration) (time.Duration, error) {
	raw := getEnv(key, "")
	if raw == "" {
		return def, nil
	}
	d, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return d, nil
}

func getInt(key string, def int64) (int64, error) {
	raw := getEnv(key, "")
	if raw == "" {
		return def, nil
	}
	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return n, nil
}

func getBool(key string, def bool) (bool, error) {
	raw := getEnv(key, "")
	if raw == "" {
		return def, nil
	}
	b, err := strconv.ParseBool(raw)
	if err != nil {
		return false, fmt.Errorf("%s: %w", key, err)
	}
	return b, nil
}
