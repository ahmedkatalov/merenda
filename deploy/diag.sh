#!/usr/bin/env bash
# Merenda deploy diagnostics. Run on the server: bash /opt/merenda/deploy/diag.sh
cd /opt/merenda 2>/dev/null || true
echo "===== 1. Listening ports (need :80 and :443) ====="
ss -tlnp 2>/dev/null | grep -E ':(22|80|443|8080)\b' || ss -tlnp 2>/dev/null
echo
echo "===== 2. UFW status ====="
ufw status verbose 2>/dev/null || echo "ufw inactive/not installed"
echo
echo "===== 3. Containers ====="
docker compose ps 2>/dev/null
echo
echo "===== 4. Caddy local answer on :80 (expect a redirect code 308) ====="
curl -s -m 5 -o /dev/null -w "http80 code=%{http_code}\n" -H 'Host: merenda-coffee.ru' http://127.0.0.1/api/v1/healthz 2>/dev/null || echo "no answer from Caddy :80"
echo "----- Caddy local answer on :443 -----"
curl -sk -m 8 -o /dev/null -w "https443 code=%{http_code}\n" --resolve merenda-coffee.ru:443:127.0.0.1 https://merenda-coffee.ru/api/v1/healthz 2>/dev/null || echo "no answer from Caddy :443"
echo
echo "===== 5. API direct ====="
docker compose exec -T api wget -qO- http://127.0.0.1:8080/api/v1/healthz 2>/dev/null || echo "api no answer"
echo
echo "===== 6. Caddy cert / ACME log (last lines) ====="
docker compose logs caddy 2>/dev/null | grep -iE 'certificate|acme|obtain|error|tls|challenge' | tail -20 || docker compose logs caddy 2>/dev/null | tail -20
echo
echo "===== 7. Outbound to Let's Encrypt (needed for certs) ====="
curl -s -m 8 -o /dev/null -w "acme-v02 reachable code=%{http_code}\n" https://acme-v02.api.letsencrypt.org/directory 2>/dev/null || echo "LE not reachable"
echo "===== DONE ====="
