# Merenda API (backend)

REST API for the Merenda café platform: public site bootstrap, menu, order hand-off to WhatsApp, media storage and the admin CMS. Go 1.26 · chi · pgx · PostgreSQL 16.

The contract is `docs/API.md` + `packages/shared/src/types.ts`; every JSON shape here mirrors those files field for field (camelCase, `null` for nullable values, `[]` for empty arrays).

## Quick start

```bash
cp ../.env.example .env         # or edit the existing backend/.env
# set JWT_SECRET (≥16 chars), ADMIN_EMAIL, ADMIN_PASSWORD
go run ./cmd/server             # http://localhost:8080
```

On start the server loads `.env` (backend dir, repo root, or next to the binary — never overriding real environment variables), connects to PostgreSQL, applies the embedded SQL migrations (`internal/migrations`, idempotent, advisory-locked), creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` when the `admins` table is empty, and serves. A warning is logged while the placeholder password `change-me-now` is in use.

Requirements: Go ≥ 1.26, PostgreSQL 16 (`make db-up` at the repo root starts one with Docker).

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | `production` switches to JSON logs and trusts proxy headers |
| `HTTP_ADDR` | `:8080` | listen address |
| `DATABASE_URL` | `postgres://merenda:merenda@localhost:5432/merenda?sslmode=disable` | pgx connection string |
| `JWT_SECRET` | — (required, ≥ 16 chars) | HS256 key for access tokens |
| `ACCESS_TOKEN_TTL` | `15m` | access token lifetime |
| `REFRESH_TOKEN_TTL` | `720h` | refresh session / cookie lifetime |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | `admin@merenda.ru`, `change-me-now`, `Владелец` | first admin (only when no admins exist) |
| `PUBLIC_SITE_URL` | `http://localhost:5173` | CORS allow-list, `robots.txt`, `sitemap.xml` |
| `ADMIN_SITE_URL` | `http://localhost:5174` | CORS allow-list |
| `UPLOAD_DIR` | `./data/uploads` | media root, served at `/uploads/*` |
| `MAX_UPLOAD_MB` | `10` | upload cap (413 above it) |
| `COOKIE_SECURE` | `false` | `Secure` flag on the refresh cookie (true behind HTTPS) |
| `TRUST_PROXY` | `true` in production | honour `X-Forwarded-For` / `X-Real-IP` from Caddy |

## Layout

```
cmd/server/main.go        wiring: config → db → migrate → seed admin → router → http.Server (graceful shutdown)
internal/config           env parsing with defaults
internal/db               pgx pool (UTC timestamps), migration runner (schema_migrations)
internal/migrations       0001_schema.sql, 0002_seed.sql (embedded)
internal/domain           Go structs mirroring types.ts, inputs, Optional[T] for PATCH, error types
internal/repo             SQL per aggregate (admins, sessions, media, menus, categories, products, orders, schedules, settings, sections)
internal/service          auth · catalog · hours (status engine) · schedules · sections · settings · theme · slug ·
                          orders (pricing + WhatsApp) · media (sniff/variants) · site (bootstrap/menu/robots/sitemap) · dashboard
internal/httpapi          router.go · middleware/ (real ip, request id, logging, recover, secure headers, body limit,
                          rate limit, auth) · handlers/ (public_*, admin_*) · respond/ (JSON + error envelope)
internal/storage          Storage interface + local disk implementation (immutable caching, no listing, no traversal)
scripts/smoke.sh          end-to-end smoke test against a running server
```

## Endpoints

Base path `/api/v1` (see `docs/API.md` for shapes and status codes).

Public: `GET /site`, `GET /menu`, `GET /status`, `POST /orders` (10/min per IP), `GET /healthz`; root-level `GET /robots.txt`, `GET /sitemap.xml`, `GET /uploads/*`.

Admin (`/api/v1/admin`, Bearer access token, 300/min per IP): `auth/*` (login 5/min per IP + progressive per-e-mail lockout, refresh-cookie rotation, logout, me, password, sessions), `dashboard`, `menus`, `categories`, `products`, `media` (multipart upload), `orders`, `schedules` (+ hours, exceptions), `settings/:key`, `theme/presets`, `sections`.

Errors are always `{ "error": { "code", "message", "fields"? } }` with codes `validation_error` (400, Russian per-field messages), `unauthorized`, `forbidden`, `not_found`, `conflict`, `payload_too_large`, `unsupported_media`, `rate_limited`, `internal`.

## Behaviour notes

- **Auth**: argon2id passwords; HS256 access JWT (sub = admin id, sid = session id) validated against a live session on every request; refresh token = 32 random bytes, SHA-256 stored, rotated on `/auth/refresh`, delivered as the `merenda_refresh` cookie (`HttpOnly`, `SameSite=Strict`, `Path=/api/v1/admin/auth`, `Secure` = `COOKIE_SECURE`). Password change revokes every other session.
- **Orders**: the client sends product ids + quantities only. The server re-prices from the database, rejects unknown/hidden/unavailable products (`fields.items`), enforces `orders.enabled`, allowed types, `minOrderMinor` and `blockWhenClosed` (venue status *and* each menu's own schedule), stores the order with item snapshots in one transaction and returns the WhatsApp message plus `https://wa.me/<digits>?text=…` (`null` when no number is configured). Money renders as `1 150 ₽`.
- **Media**: MIME sniffed from the first 512 bytes (jpeg/png/webp/gif only), size capped, random `ab/<32 hex>.<ext>` names, dimensions decoded, `thumb` (≤ 480 px) and `medium` (≤ 1400 px) variants generated with Catmull-Rom (PNG stays PNG, others become JPEG q85; a variant is skipped when the source already fits and the API then falls back to the original URL). GIFs are stored untouched. Deleting removes files and row; references become `null` via FK.
- **Status engine**: `service/hours` handles overnight intervals, per-date exceptions, `nextOpenAt` (8-day lookahead), Russian messages and the admin `temporarily_closed` override.
- **Site bootstrap**: `media` contains every media object referenced by `business.logoId`, `business.faviconId`, `seo.ogImageId` and any UUID found recursively inside enabled sections' settings.
- **Security headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` on every response, `Cache-Control: no-store` under `/api/*`; JSON bodies limited to 1 MB; CORS allow-list = `PUBLIC_SITE_URL` + `ADMIN_SITE_URL` with credentials.

## Checks

```bash
gofmt -l . && go vet ./... && go test ./... && go build ./...
go run ./cmd/server &            # then, against the running server:
scripts/smoke.sh                 # ADMIN_EMAIL / ADMIN_PASSWORD / API_URL can be overridden
```

## Docker

```bash
docker build -t merenda-api .
docker run --rm -p 8080:8080 --env-file .env \
  -e DATABASE_URL=postgres://merenda:merenda@host.docker.internal:5432/merenda?sslmode=disable \
  -v merenda_uploads:/data/uploads merenda-api
```

The image is multi-stage (`golang:1.26-alpine` → `alpine` with `ca-certificates` + `tzdata`), runs as a non-root user, stores media in `/data/uploads` and exposes `8080`. `docker-compose.yml` at the repo root wires it together with PostgreSQL, both frontends and Caddy.
