#!/usr/bin/env bash
# Short local reachability check. Run: bash /opt/merenda/deploy/local-check.sh
cd /opt/merenda 2>/dev/null
echo "--- listening on 80/443 ---"
ss -tlnp 2>/dev/null | grep -E ':80 |:443 ' || echo "  NOTHING on 80/443"
c80=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -H 'Host: merenda-coffee.ru' http://127.0.0.1/ 2>/dev/null)
c443=$(curl -sk -m 6 -o /dev/null -w "%{http_code}" --resolve merenda-coffee.ru:443:127.0.0.1 https://merenda-coffee.ru/api/v1/healthz 2>/dev/null)
api=$(docker compose exec -T api wget -qO- http://127.0.0.1:8080/healthz 2>/dev/null)
echo
echo "==================== RESULT ===================="
echo "Caddy local :80  = ${c80:-none}   (need 308)"
echo "Caddy local :443 = ${c443:-none}  (need 200/308)"
echo "API direct       = ${api:-none}"
if [ "$c80" = "308" ] || [ "$c443" = "200" ] || [ "$c443" = "308" ]; then
  echo "VERDICT: APP OK LOCALLY -> blocked by Selectel NETWORK (floating IP)"
else
  echo "VERDICT: Caddy NOT answering locally -> app/port problem"
fi
echo "================================================"
