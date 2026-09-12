# Merenda REST API

Base path: `/api/v1`. JSON everywhere (`Content-Type: application/json`), except media upload (multipart).
Type shapes referenced below live in `packages/shared/src/types.ts` — they are the contract.

Conventions
- ids: UUID strings. Money: minor units (kopecks). Weekdays: 0=Mon … 6=Sun. Times: `HH:MM`.
- Success: `200` with the resource; `201` on create; `204` on delete.
- Errors: `{ "error": { "code": string, "message": string, "fields"?: {field: message} } }`
  - `400 validation_error` (with `fields`), `401 unauthorized`, `403 forbidden`, `404 not_found`,
    `409 conflict`, `413 payload_too_large`, `415 unsupported_media`, `429 rate_limited`, `500 internal`.
- Lists sorted by `sortOrder` unless stated. Timestamps ISO-8601 UTC.
- Media `url`/`thumbUrl`/`mediumUrl` are root-relative paths (`/uploads/...`); the frontends prefix `VITE_API_URL` when set.

## Public (no auth)

| Method | Path | Response | Notes |
|---|---|---|---|
| GET | `/site` | `SiteBootstrap` | Everything the site needs on load except products. `sections` = enabled only, sorted. `media` = map of referenced media. `orders` is `PublicOrderSettings` (WhatsApp number is never exposed). |
| GET | `/menu` | `PublicMenuResponse` | Active menus → active categories → products with availability ≠ `hidden`, sorted. Categories without visible products are still returned (client hides them). |
| GET | `/status` | `SiteStatus` | Cheap; polled by the client every 60 s. |
| POST | `/orders` | `CreateOrderResponse` (201) | Body `CreateOrderRequest`. Server re-prices from DB, rejects hidden/unavailable products (`validation_error`, `fields.items`), respects `OrderSettings` (enabled, allowed types, min order, blockWhenClosed — checks venue status and each item's menu schedule). Builds the WhatsApp message + `https://wa.me/<digits>?text=<urlencoded>`; `whatsappUrl` is `null` when no number is configured. Rate limit: 10/min per IP. |
| GET | `/robots.txt` | text | From `seo.robotsIndex`; includes `Sitemap:` line with `PUBLIC_SITE_URL`. |
| GET | `/sitemap.xml` | xml | Single URL (`PUBLIC_SITE_URL`) with lastmod = latest product/settings update. |
| GET | `/uploads/*` | file | Static media, `Cache-Control: public, max-age=31536000, immutable`. Files are content-addressed random names. |
| GET | `/healthz` | `{ "ok": true }` | |

WhatsApp message format (plain text, `\n` newlines):
```
{orders.messageTitle}            → "Новый заказ — Меренда"
Заказ №1042
Тип: На вынос
Имя: Иван                        (only if provided)
Телефон: +7…                     (only if provided)

Заказ:
Капучино × 2 — 700 ₽
Чизкейк × 1 — 450 ₽

Итого: 1 150 ₽
Комментарий: без сахара          (only if provided)
{orders.messageFooter}           (only if non-empty)
```

## Admin (`/api/v1/admin`, Bearer JWT except auth endpoints)

Auth
| Method | Path | Body → Response |
|---|---|---|
| POST | `/auth/login` | `LoginRequest` → `LoginResponse`. Sets httpOnly cookie `merenda_refresh` (`Path=/api/v1/admin/auth`, `SameSite=Strict`, `Secure` when `COOKIE_SECURE=true`). Rate limit 5/min per IP + progressive delay per email. |
| POST | `/auth/refresh` | cookie → `LoginResponse` (rotates refresh token). |
| POST | `/auth/logout` | cookie → 204, revokes session, clears cookie. |
| GET | `/auth/me` | → `AdminUser` |
| PATCH | `/auth/me` | `UpdateProfileRequest` → `AdminUser` |
| POST | `/auth/password` | `ChangePasswordRequest` → 204. Revokes all other sessions. |
| GET | `/auth/sessions` | → `AdminSession[]` |
| DELETE | `/auth/sessions/:id` | → 204 |

Dashboard
| GET | `/dashboard` | → `DashboardStats` |

Menus
| GET | `/menus` | → `Menu[]` |
| POST | `/menus` | `MenuInput` → `Menu` (201) |
| PATCH | `/menus/:id` | `Partial<MenuInput>` → `Menu` |
| DELETE | `/menus/:id` | → 204 (cascades categories/products) |
| PUT | `/menus/reorder` | `ReorderRequest` → 204 |

Categories
| GET | `/categories?menuId=` | → `Category[]` |
| POST | `/categories` | `CategoryInput` → `Category` (201) |
| PATCH | `/categories/:id` | `Partial<CategoryInput>` → `Category` |
| DELETE | `/categories/:id` | → 204 |
| PUT | `/categories/reorder` | `ReorderRequest` → 204 (ids may span one menu) |

Products
| GET | `/products?menuId=&categoryId=&availability=&q=` | → `ProductListItem[]` |
| GET | `/products/:id` | → `Product` |
| POST | `/products` | `ProductInput` → `Product` (201) |
| PATCH | `/products/:id` | `Partial<ProductInput>` → `Product` |
| PATCH | `/products/:id/availability` | `{ availability }` → `Product` |
| DELETE | `/products/:id` | → 204 |
| PUT | `/products/reorder` | `ReorderRequest` → 204 |

Media
| GET | `/media?kind=&q=&page=&perPage=` | → `Paginated<Media>` (newest first) |
| GET | `/media/:id` | → `Media` (resolve a single reference outside the first page) |
| POST | `/media` | multipart `file` (+ optional `alt`) → `Media` (201). Allowed: image/jpeg, image/png, image/webp, image/gif; sniffed, not trusted from extension. Max `MAX_UPLOAD_MB`. Images get thumb (≤480) and medium (≤1400) variants; GIFs are stored as-is. |
| PATCH | `/media/:id` | `{ alt }` → `Media` |
| DELETE | `/media/:id` | → 204 (references become null via FK) |

Orders
| GET | `/orders?status=&type=&page=&perPage=` | → `Paginated<Order>` (newest first) |
| GET | `/orders/:id` | → `Order` |
| PATCH | `/orders/:id/status` | `{ status }` → `Order` |
| DELETE | `/orders/:id` | → 204 |

Schedules (working hours)
| GET | `/schedules` | → `Schedule[]` (venue first) |
| POST | `/schedules` | `ScheduleInput` → `Schedule` (201, kind=custom, 7 default days) |
| PATCH | `/schedules/:id` | `ScheduleInput` → `Schedule` |
| PUT | `/schedules/:id/hours` | `ScheduleHoursInput` → `Schedule` |
| DELETE | `/schedules/:id` | → 204 (venue cannot be deleted → 409) |
| POST | `/schedules/:id/exceptions` | `ScheduleExceptionInput` → `ScheduleException` (201; upsert by date) |
| DELETE | `/schedules/:id/exceptions/:exceptionId` | → 204 |

Settings
| GET | `/settings` | → `SettingsMap` (theme normalized with defaults) |
| GET | `/settings/:key` | → the typed value |
| PUT | `/settings/:key` | typed value → typed value. Keys: `business`, `contacts`, `orders`, `seo`, `status`, `theme`. Validated per key. |
| GET | `/theme/presets` | → `ThemePreset[]` (served from a Go copy of `packages/shared/src/theme.ts`) |

Sections (site builder)
| GET | `/sections` | → `PageSection[]` (all, incl. disabled, sorted) |
| POST | `/sections` | `SectionInput` → `PageSection` (201; unique types → 409) |
| PATCH | `/sections/:id` | `SectionPatch` → `PageSection` |
| DELETE | `/sections/:id` | → 204 (locked → 409) |
| PUT | `/sections/reorder` | `ReorderRequest` → 204 (header always first, footer always last regardless of the list) |

## Security summary
- Passwords: argon2id. Access JWT (HS256, `JWT_SECRET`, 15 min). Refresh: random 32 bytes, SHA-256 stored in `admin_sessions`, 30 days, rotated on refresh.
- CORS: only `PUBLIC_SITE_URL` and `ADMIN_SITE_URL` origins; credentials allowed for the admin origin.
- Security headers on every response (`X-Content-Type-Options`, `X-Frame-Options: DENY` for API/admin, `Referrer-Policy`).
- Upload: content sniffing, size cap, random file names, no path from client, images re-encoded for variants.
- Rate limits: login 5/min/IP; public order 10/min/IP; general admin API 300/min/IP.
- Request body limit 1 MB (JSON).
