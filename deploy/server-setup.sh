#!/usr/bin/env bash
# One-shot server setup for Merenda: Docker (if needed) -> .env with generated
# secrets -> build & start. Designed so the operator types no special characters
# in the console: just `bash /opt/merenda/deploy/server-setup.sh`.
set -euo pipefail
cd /opt/merenda

# 1. Docker + swap + firewall, only if Docker is not installed yet.
if ! command -v docker >/dev/null 2>&1; then
  echo "== Устанавливаю Docker и готовлю сервер =="
  bash deploy/bootstrap.sh
fi

# 2. .env from template, then fill secrets safely (printf, no sed delimiters).
[ -f .env ] || cp .env.production.example .env

setkv() {
  local key="$1" val="$2"
  grep -v "^${key}=" .env > .env.tmp 2>/dev/null || true
  mv .env.tmp .env
  printf '%s=%s\n' "$key" "$val" >> .env
}

if grep -q '^JWT_SECRET=CHANGE_ME' .env; then setkv JWT_SECRET "$(openssl rand -hex 32)"; fi
if grep -q '^POSTGRES_PASSWORD=CHANGE_ME' .env; then setkv POSTGRES_PASSWORD "$(openssl rand -hex 24)"; fi

if grep -q '^ADMIN_PASSWORD=CHANGE_ME' .env; then
  echo
  read -rp "Придумайте пароль администратора (только латиница и цифры): " pw
  if [ -z "${pw}" ]; then echo "Пустой пароль недопустим."; exit 1; fi
  setkv ADMIN_PASSWORD "$pw"
fi

echo
echo "== .env готов =="
grep -E '^(MERENDA_SITE_DOMAIN|MERENDA_ADMIN_DOMAIN|ADMIN_EMAIL|ADMIN_PASSWORD)=' .env
echo

# 3. Build & start in the background so a console disconnect can't abort it.
echo "== Сборка и запуск (5-10 минут, в фоне) =="
nohup docker compose up -d --build > /root/deploy.log 2>&1 &
echo
echo "Прогресс:   tail -f /root/deploy.log"
echo "Статус:     cd /opt/merenda && docker compose ps"
