# Merenda — Architecture

Two separate web apps and one API, sharing a typed contract.

```
merenda/
├── backend/            Go 1.26 · chi · pgx · PostgreSQL          → REST API, media storage, status engine
├── frontend/           React 19 · TS · Vite · Tailwind v4        → client site (merenda.ru)
├── admin/              React 19 · TS · Vite · Tailwind v4        → admin CMS (merenda-admin.ru)
├── packages/shared/    TypeScript only                           → API types, theme presets, section schemas
├── deploy/             Caddyfile (two domains → one API)
├── docs/               this file, API.md
└── docker-compose.yml  postgres + api + site + admin + caddy
```

## Domains

| Domain | Serves | API |
|---|---|---|
| `merenda.ru` | `frontend/dist` (static) | `/api/*`, `/uploads/*`, `/robots.txt`, `/sitemap.xml` reverse-proxied to backend |
| `merenda-admin.ru` | `admin/dist` (static) | `/api/*`, `/uploads/*` reverse-proxied to backend |

Both frontends call the API same-origin (`VITE_API_URL` empty). That keeps the refresh cookie first-party and makes domain changes a pure config change: edit `deploy/Caddyfile` and `PUBLIC_SITE_URL` / `ADMIN_SITE_URL` in `.env`. Nothing in code knows the domain.

## Backend layout (`backend/`)

```
cmd/server/main.go               wiring: config → db → migrate → seed admin → router → http.Server (graceful shutdown)
internal/config                  env parsing with defaults
internal/db                      pgx pool, embedded SQL migration runner (schema_migrations table)
internal/migrations/*.sql        0001_schema, 0002_seed
internal/domain                  Go structs mirroring packages/shared/src/types.ts (camelCase JSON tags)
internal/repo                    one file per aggregate: admins, sessions, media, menus, categories, products, orders, schedules, settings, sections
internal/service                 auth (argon2id, JWT, refresh rotation), hours (status engine), orders (pricing + WhatsApp message), media (sniff/variants), theme (presets/normalize), site (bootstrap assembly)
internal/httpapi                 router.go, middleware/ (auth, cors, ratelimit, secure headers, request id, recover, body limit), handlers/ (public_*.go, admin_*.go), respond/ (JSON + error helpers)
internal/storage                 Storage interface + local disk implementation (S3 can be added without touching handlers)
```

### Status engine (`service/hours`)
Input: schedules (7 days + exceptions), `status` setting (`auto` | `temporarily_closed`), business timezone, now.
For each schedule: apply today's exception if any; handle overnight intervals (closesAt ≤ opensAt spans midnight, so yesterday's interval is also checked); produce `isOpen`, today's `opensAt/closesAt`, `nextOpenAt` (scan ≤ 8 days), and a Russian message ("Сегодня открыто до 22:00", "Откроется завтра в 08:00", "Кухня работает до 21:00"). The venue result is overridden when mode is `temporarily_closed`.

### Orders
Client sends product ids + quantities only. Server loads products, rejects hidden/unavailable ones, recomputes totals, checks order settings and schedule state, stores order + item snapshots, builds the WhatsApp message and `wa.me` URL. Orders are stored even when WhatsApp is not configured, so they always appear in the admin.

### Media
Multipart upload → sniff MIME → cap size → random name `ab/abcdef….ext` under `UPLOAD_DIR` → for JPEG/PNG/WebP generate `thumb` (≤480px) and `medium` (≤1400px) variants; GIF stored untouched (animation). DB row stores relative paths; API returns `/uploads/...` URLs.

## Frontend (client site)

```
src/app/                 App.tsx, providers, router (single page + /order/:id success), preview bridge
src/features/site/       useSite() (bootstrap + status polling), theme application, SEO head
src/features/menu/       MenuSection, MenuTabs, CategoryNav (sticky, scroll-spy), ProductCard (cards/list/compact), ProductSheet (modal/bottom sheet)
src/features/cart/       zustand store (persist), CartDrawer, CartButton (floating on mobile), quantity stepper
src/features/order/      OrderTypeChooser (dine-in / takeaway cards), CheckoutForm, OrderSuccess (WhatsApp handoff)
src/sections/            one component per SectionType; SectionRenderer maps `sections[]` → components
src/components/ui/       Button, Badge, Sheet, Skeleton, Container, Icon
src/lib/                 api client (typed fetch), media url helper, format re-exports
```
Theme: `applyThemeToElement(theme, document.documentElement)` sets CSS custom properties; Tailwind utilities reference them (`bg-surface`, `text-heading`, `rounded-card` …) through `@theme` in `index.css`. Fonts are loaded on demand via a single `<link>` built by `buildFontsUrl`.

Live preview: when opened with `?preview=1` the site posts `merenda:preview:ready` to `window.parent` and applies incoming `PreviewMessage`s (theme / sections / business) on top of fetched data without saving anything.

Responsive: mobile-first. Mobile = single column or 2-up compact cards, sticky category chips, floating cart pill, bottom-sheet modals with safe-area padding. Tablet = 2 columns, drawer cart. Desktop = up to 4 columns, side cart drawer, sticky header with nav.

## Admin

```
src/app/                 router, providers, ProtectedRoute, AppShell (sidebar + topbar + mobile nav)
src/features/auth/       login page, auth store (access token in memory, refresh on 401)
src/features/dashboard/
src/features/menus/  categories/  products/  orders/  hours/  appearance/  builder/  media/  settings/  security/
src/components/ui/       design system: Button, Input, Select, Switch, Textarea, Card, Dialog, Drawer, Tabs, Badge, Table, EmptyState, Skeleton, Toast (sonner), ConfirmDialog, ColorField, MediaPicker, SortableList (dnd-kit)
src/lib/                 api client (typed, with refresh), query keys, form helpers
```
Appearance and Builder pages embed the client site (`VITE_SITE_URL/?preview=1`) in an iframe and post `PreviewMessage`s on every change (debounced 150 ms). Saving persists via `PUT /settings/theme` / `PATCH /sections/:id`.

## Security
- argon2id password hashes, JWT access (15 min) + rotating refresh cookie (httpOnly, SameSite=Strict, path-scoped), sessions revocable.
- All `/api/v1/admin/*` behind auth middleware; public API is read-only except `POST /orders`.
- CORS allow-list from env, rate limiting (login, orders, general), body size limits, sniffed uploads, random filenames, security headers.
- No secrets in either frontend bundle; the WhatsApp number never leaves the backend except inside the generated `wa.me` link of an order the visitor just placed.

## Local development
```
make db-up        # postgres via docker compose (or use a local postgres)
make api          # go run ./cmd/server  (auto-migrates + seeds, creates admin from .env)
npm install       # once, at repo root (workspaces)
npm run dev:site  # http://localhost:5173  (proxies /api → :8080)
npm run dev:admin # http://localhost:5174  (proxies /api → :8080)
```
