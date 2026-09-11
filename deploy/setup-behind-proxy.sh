#!/usr/bin/env bash
# Deploy Merenda alongside an existing "noor" Caddy stack (shared 80/443).
# Builds Merenda without its own Caddy, joins noor's network, and adds two
# vhost blocks to noor's Caddyfile (with backup + validation + graceful reload).
# Run: bash /opt/merenda/deploy/setup-behind-proxy.sh
set -euo pipefail
cd /opt/merenda

NOOR_CADDY_CONTAINER="noor_caddy"
NOOR_CADDYFILE="/root/noor/Caddyfile"

echo "== 1. .env =="
[ -f .env ] || cp .env.production.example .env
setkv(){ grep -v "^$1=" .env > .env.tmp 2>/dev/null || true; mv .env.tmp .env; printf '%s=%s\n' "$1" "$2" >> .env; }
grep -q '^JWT_SECRET=CHANGE_ME' .env && setkv JWT_SECRET "$(openssl rand -hex 32)" || true
grep -q '^POSTGRES_PASSWORD=CHANGE_ME' .env && setkv POSTGRES_PASSWORD "$(openssl rand -hex 24)" || true
if grep -q '^ADMIN_PASSWORD=CHANGE_ME' .env; then
  read -rp "Пароль администратора Merenda (латиница и цифры): " pw
  [ -n "$pw" ] || { echo "Пустой пароль недопустим"; exit 1; }
  setkv ADMIN_PASSWORD "$pw"
fi
echo "Домены: $(grep -E '^MERENDA_(SITE|ADMIN)_DOMAIN=' .env | tr '\n' ' ')"

echo
echo "== 2. Сборка и запуск Merenda (без своего Caddy, в сети noor_default) =="
docker compose -f docker-compose.behind-proxy.yml up -d --build

echo
echo "== 3. Добавляю домены Merenda в Caddyfile noor =="
if [ ! -f "$NOOR_CADDYFILE" ]; then
  echo "Не найден $NOOR_CADDYFILE — пропускаю. Добавьте блоки вручную (см. README)."
  exit 0
fi
if grep -q 'merenda-coffee.ru' "$NOOR_CADDYFILE"; then
  echo "Блоки Merenda уже присутствуют — не дублирую."
else
  BAK="$NOOR_CADDYFILE.bak.$(date +%s)"
  cp "$NOOR_CADDYFILE" "$BAK"
  echo "Бэкап: $BAK"
  cat >> "$NOOR_CADDYFILE" <<'CADDY'

# ---- Merenda (добавлено автоматически) ----
merenda-coffee.ru, www.merenda-coffee.ru {
	encode zstd gzip
	@merenda_api path /api/* /uploads/* /robots.txt /sitemap.xml /healthz
	handle @merenda_api {
		reverse_proxy merenda-api:8080
	}
	handle {
		reverse_proxy merenda-site:80
	}
}

merenda-admin.ru {
	encode zstd gzip
	header {
		X-Frame-Options "DENY"
		X-Content-Type-Options "nosniff"
	}
	@merenda_api path /api/* /uploads/*
	handle @merenda_api {
		reverse_proxy merenda-api:8080
	}
	handle {
		reverse_proxy merenda-admin:80
	}
}
CADDY
fi

echo
echo "== 4. Проверка и мягкая перезагрузка Caddy noor =="
if docker exec "$NOOR_CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  docker exec "$NOOR_CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  echo "OK: noor Caddy перезагружен, домены Merenda добавлены."
else
  echo "ВНИМАНИЕ: проверка конфига Caddy не прошла — НЕ перезагружаю (CRM цел)."
  echo "Восстановить: последний .bak в /root/noor/. Покажите вывод:"
  docker exec "$NOOR_CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile || true
  exit 1
fi

echo
echo "ГОТОВО. Проверьте: https://merenda-coffee.ru  и  https://merenda-admin.ru"
echo "Логи сертификатов:  docker logs -f $NOOR_CADDY_CONTAINER"
