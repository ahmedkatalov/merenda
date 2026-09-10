# Merenda

Платформа меню и заказов для заведения «Меренда»: клиентский сайт, отдельная защищённая админ-панель и REST API.

| Часть | Технологии | Домен |
|---|---|---|
| `frontend/` — клиентский сайт | React 19 · TypeScript · Vite · Tailwind v4 · motion | `merenda-coffee.ru` |
| `admin/` — админ-панель (CMS) | React 19 · TypeScript · Vite · Tailwind v4 · dnd-kit · react-hook-form | `merenda-admin.ru` |
| `backend/` — API | Go 1.26 · chi · pgx · PostgreSQL 16 | `/api/*` на обоих доменах |
| `packages/shared/` | TypeScript-контракт: типы API, пресеты темы, схемы блоков | — |

Подробно: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md).

## Быстрый старт (разработка)

Требуется Go ≥ 1.26, Node ≥ 20, PostgreSQL 16 (локально или `make db-up` через Docker).

```bash
cp .env.example backend/.env        # задайте JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install                          # один раз, в корне (workspaces)
make api                             # http://localhost:8080 — миграции и стартовые данные применяются автоматически
npm run dev:site                     # http://localhost:5173 — сайт
npm run dev:admin                    # http://localhost:5174 — админка
```

Первый администратор создаётся из `ADMIN_EMAIL` / `ADMIN_PASSWORD`, если таблица администраторов пуста. Смените пароль в разделе «Безопасность».

## Продакшен

Пошаговая инструкция: [deploy/DEPLOY.md](deploy/DEPLOY.md). Кратко, на сервере:

```bash
cp .env.production.example .env      # домены, секреты, первый админ
docker compose up -d --build
```

Caddy (`deploy/Caddyfile`) обслуживает `merenda-coffee.ru` → сайт и `merenda-admin.ru` → админка, проксирует `/api/*` и `/uploads/*` на API и сам получает TLS-сертификаты. Домены берутся из `.env` (`MERENDA_SITE_DOMAIN` / `MERENDA_ADMIN_DOMAIN`) — в коде и конфигах их нет, смена домена = правка `.env` и пересборка.

## Что настраивается в админке

Название, логотип, контакты, WhatsApp-номер, часы работы (заведение, кухня, бар и любые другие расписания, особые даты), временное закрытие с текстом причины, меню/категории/блюда с наличием, ценами, фото и GIF, заказы, тема (цвета, шрифты, радиусы, тени, плотность, 6 пресетов) с живым предпросмотром, порядок и настройки всех блоков сайта, медиатека, SEO.

## Проверки

```bash
npm run typecheck                    # shared + frontend + admin
npm run build                        # сборка обоих приложений
cd backend && go vet ./... && go test ./...
```
