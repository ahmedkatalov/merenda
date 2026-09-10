# Развёртывание Меренды на сервере (Ubuntu 22.04)

Отдельный сервер, весь стек в Docker: PostgreSQL, Go API, статика сайта и админки, Caddy как reverse-proxy с автоматическим TLS. Домены задаются только в `.env` — в коде их нет.

Домены: сайт — `merenda-coffee.ru`, админка — `merenda-admin.ru`. `SERVER_IP` — публичный IP сервера Arya (замените в командах ниже).

---

## 1. DNS

Создайте две A-записи, указывающие на публичный IP сервера:

| Запись | Тип | Значение |
|---|---|---|
| `merenda-coffee.ru` (сайт) | A | `SERVER_IP` |
| `merenda-admin.ru` (админка) | A | `SERVER_IP` |

Дождитесь, пока записи разрешаются (`dig +short merenda-coffee.ru`). Без рабочего DNS Caddy не сможет получить сертификаты.

## 2. Фаервол Selectel

В панели Selectel откройте на сервере входящие порты **22 (SSH), 80 (HTTP), 443 (HTTPS)** в «Группы безопасности» / «Файрволы». Скрипт из шага 4 дополнительно включит UFW на самом сервере.

## 3. Подготовка сервера

Зайдите по SSH и выполните bootstrap (Docker, swap, UFW). Его можно запустить до или после переноса кода — он не зависит от кода:

```bash
sudo bash deploy/bootstrap.sh
```

Если код ещё не на сервере, поставьте Docker вручную: `curl -fsSL https://get.docker.com | sh`.

## 4. Перенос кода на сервер

Выберите один способ. Каталог назначения — `/opt/merenda`.

**Вариант А — rsync с вашего Mac** (без внешних сервисов):

```bash
rsync -avz --delete \
  --exclude node_modules --exclude .git --exclude dist \
  --exclude backend/data --exclude .env \
  /Users/aaaaaakk12123gmail.com/Desktop/merenda/ root@SERVER_IP:/opt/merenda/
```

**Вариант Б — Git** (удобнее для обновлений): запушьте репозиторий в приватный GitHub, затем на сервере:

```bash
sudo mkdir -p /opt/merenda && sudo chown "$USER" /opt/merenda
git clone git@github.com:ВАШ_АККАУНТ/merenda.git /opt/merenda
```

## 5. Настройка `.env`

```bash
cd /opt/merenda
cp .env.production.example .env
# сгенерируйте секреты:
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
nano .env
```

Заполните: `MERENDA_SITE_DOMAIN`, `MERENDA_ADMIN_DOMAIN` (без `https://`), `JWT_SECRET`, `POSTGRES_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## 6. Запуск

```bash
cd /opt/merenda
docker compose up -d --build
```

Первая сборка займёт несколько минут (собираются два фронтенда и Go-бинарник). Дальше:

```bash
docker compose ps          # все сервисы должны быть healthy/running
docker compose logs -f caddy   # тут видно получение TLS-сертификатов
docker compose logs -f api     # "migration applied", "seed admin created", "listening"
```

## 7. Проверка

```bash
curl -s https://merenda-coffee.ru/api/v1/healthz     # {"ok":true}
curl -s https://merenda-coffee.ru/api/v1/status      # статус заведения
```

Откройте в браузере:
- сайт — `https://merenda-coffee.ru`
- админку — `https://merenda-admin.ru` (вход по `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env`).

## 8. После установки (в админке)

1. **Безопасность** → смените пароль администратора.
2. **WhatsApp / Заказы** → укажите рабочий номер (иначе заказы только сохраняются, без отправки).
3. **Блюда** → проставьте реальные цены (в стартовых данных — плейсхолдеры).
4. **Настройки** → название, контакты, логотип, часы работы.

---

## Обновление версии

```bash
cd /opt/merenda
# rsync заново, либо: git pull
docker compose up -d --build
```

Данные (база в томе `pgdata`, загруженные фото в `uploads`) сохраняются между пересборками.

## Резервные копии

```bash
# База
docker compose exec -T db pg_dump -U merenda merenda | gzip > merenda-$(date +%F).sql.gz
# Загруженные изображения
docker run --rm -v merenda_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Восстановление базы: `gunzip -c merenda-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U merenda merenda`.

## Полезные команды

```bash
docker compose restart api        # перезапустить только API
docker compose logs -f api        # логи
docker compose down               # остановить всё (данные в томах остаются)
docker compose exec db psql -U merenda merenda   # консоль БД
```

## Если что-то не так

- **Caddy не выдал сертификат** — проверьте, что A-записи указывают на этот IP и порты 80/443 открыты (нужны для проверки Let's Encrypt).
- **Сайт открывается, админка «Not connected» в предпросмотре** — админка собирается с доменом сайта из `MERENDA_SITE_DOMAIN`; после смены домена пересоберите: `docker compose up -d --build admin`.
- **Мало памяти при сборке** — bootstrap уже добавил 2 ГБ swap; убедитесь, что он активен (`swapon --show`).
