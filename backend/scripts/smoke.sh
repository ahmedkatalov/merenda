#!/usr/bin/env bash
# End-to-end smoke test for the Merenda API against a running server.
#
#   scripts/smoke.sh [BASE_URL]
#
# Env: API_URL (default http://localhost:8080), ADMIN_EMAIL, ADMIN_PASSWORD.
# Requires bash, curl and python3. Leaves the database as it found it
# (everything it creates is deleted at the end).
set -uo pipefail

BASE="${1:-${API_URL:-http://localhost:8080}}"
EMAIL="${ADMIN_EMAIL:-admin@merenda.ru}"
PASSWORD="${ADMIN_PASSWORD:-merenda-admin-2026}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
JAR="$TMP/cookies.txt"
BODY="$TMP/body"
HEADERS="$TMP/headers"
TOKEN=""
STATUS=""
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); printf '  ok    %s\n' "$1"; }
fail() {
  FAIL=$((FAIL + 1))
  printf '  FAIL  %s\n' "$1"
  printf '        status=%s body=%s\n' "$STATUS" "$(head -c 300 "$BODY" 2>/dev/null | tr '\n' ' ')"
}

# req METHOD PATH [JSON_BODY] [extra curl args...]
req() {
  local method="$1" path="$2" data="${3:-}"
  shift 2
  [[ $# -gt 0 ]] && shift
  local args=(-s -o "$BODY" -D "$HEADERS" -w '%{http_code}' -X "$method" -H 'Accept: application/json' -b "$JAR" -c "$JAR")
  [[ -n "$TOKEN" ]] && args+=(-H "Authorization: Bearer $TOKEN")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' --data-binary "$data")
  STATUS="$(curl "${args[@]}" "$@" "$BASE$path")"
}

# jget PYTHON_EXPR → prints the expression evaluated with d = parsed body
jget() {
  python3 -c 'import json,sys
d = json.load(open(sys.argv[1]))
print(eval(sys.argv[2]))' "$BODY" "$1" 2>/dev/null
}

expect_status() { # NAME CODE
  if [[ "$STATUS" == "$2" ]]; then pass "$1"; else fail "$1 (want HTTP $2)"; fi
}

expect_json() { # NAME PYTHON_BOOL_EXPR
  local out
  out="$(jget "$2")"
  if [[ "$out" == "True" ]]; then pass "$1"; else fail "$1 [$2 → ${out:-error}]"; fi
}

expect_header() { # NAME HEADER_REGEX
  if grep -qiE "$2" "$HEADERS"; then pass "$1"; else fail "$1 (missing header /$2/)"; fi
}

section() { printf '\n%s\n' "$1"; }

echo "Merenda API smoke test → $BASE"

# ---------------------------------------------------------------------------
section "Public"
req GET /healthz
expect_status "GET /healthz" 200
expect_json "healthz ok" 'd["ok"] is True'

req GET /api/v1/site
expect_status "GET /site" 200
expect_json "theme has 17 color keys" 'len(d["theme"]["colors"]) == 17'
expect_json "theme preset elegant" 'd["theme"]["preset"] == "elegant"'
expect_json "sections non-empty & enabled only" 'len(d["sections"]) > 0 and all(s["isEnabled"] for s in d["sections"])'
expect_json "header first, footer last" 'd["sections"][0]["type"] == "header" and d["sections"][-1]["type"] == "footer"'
expect_json "media map present" 'isinstance(d["media"], dict)'
expect_json "schedules: venue first with 7 days" 'd["schedules"][0]["kind"] == "venue" and all(len(s["hours"]) == 7 for s in d["schedules"])'
expect_json "orders is public shape (no number)" '"whatsappConfigured" in d["orders"] and "whatsappNumber" not in d["orders"]'
expect_json "status present" '"serverTime" in d["status"] and "venue" in d["status"]'
expect_header "Cache-Control: no-store on /api" '^cache-control: no-store'
expect_header "X-Content-Type-Options" '^x-content-type-options: nosniff'
expect_header "X-Frame-Options" '^x-frame-options: DENY'
expect_header "X-Request-Id" '^x-request-id: '

req GET /api/v1/menu
expect_status "GET /menu" 200
expect_json "2 menus" 'len(d["menus"]) == 2'
expect_json "products have priceMinor" 'isinstance(d["menus"][0]["categories"][0]["products"][0]["priceMinor"], int)'
expect_json "no hidden products" 'all(p["availability"] != "hidden" for m in d["menus"] for c in m["categories"] for p in c["products"])'
expect_json "tags/attributes are arrays" 'all(isinstance(p["tags"], list) and isinstance(p["attributes"], list) for m in d["menus"] for c in m["categories"] for p in c["products"])'
FIRST_MENU="$(jget 'd["menus"][0]["id"]')"
FIRST_CATEGORY="$(jget 'd["menus"][0]["categories"][0]["id"]')"

req GET /api/v1/status
expect_status "GET /status" 200
expect_json "status shape" 'd["venue"]["mode"] in ("auto", "temporarily_closed") and isinstance(d["schedules"], list)'

req GET /robots.txt
expect_status "GET /robots.txt" 200
grep -q "Sitemap: " "$BODY" && pass "robots has Sitemap line" || fail "robots has Sitemap line"

req GET /sitemap.xml
expect_status "GET /sitemap.xml" 200
grep -q "<lastmod>" "$BODY" && pass "sitemap has lastmod" || fail "sitemap has lastmod"

req GET /api/v1/admin/dashboard
expect_status "dashboard without token → 401" 401
expect_json "error code unauthorized" 'd["error"]["code"] == "unauthorized"'

# ---------------------------------------------------------------------------
section "Auth"
req POST /api/v1/admin/auth/login "{\"email\":\"$EMAIL\",\"password\":\"definitely-wrong\"}"
expect_status "wrong password → 400" 400
expect_json "validation_error with fields" 'd["error"]["code"] == "validation_error" and "password" in d["error"]["fields"]'

req POST /api/v1/admin/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
expect_status "POST /auth/login" 200
expect_json "accessToken + user" 'len(d["accessToken"]) > 20 and d["user"]["email"] == "'"$EMAIL"'"'
expect_json "expiresIn 900" 'd["expiresIn"] == 900'
expect_header "refresh cookie set (HttpOnly, path)" '^set-cookie: merenda_refresh=.*Path=/api/v1/admin/auth.*HttpOnly'
grep -q "merenda_refresh" "$JAR" && pass "cookie stored in jar" || fail "cookie stored in jar"
FIRST_TOKEN="$(jget 'd["accessToken"]')"

req POST /api/v1/admin/auth/refresh
expect_status "POST /auth/refresh" 200
TOKEN="$(jget 'd["accessToken"]')"
[[ -n "$TOKEN" && "$TOKEN" != "$FIRST_TOKEN" ]] && pass "refresh rotates access token" || fail "refresh rotates access token"

req GET /api/v1/admin/auth/me
expect_status "GET /auth/me" 200
expect_json "me is owner" 'd["role"] == "owner"'

req GET /api/v1/admin/auth/sessions
expect_status "GET /auth/sessions" 200
expect_json "current session flagged" 'any(s["current"] for s in d)'

# ---------------------------------------------------------------------------
section "Dashboard & catalog"
req GET /api/v1/admin/dashboard
expect_status "GET /dashboard" 200
expect_json "product counts" 'd["products"]["total"] > 0 and d["menus"] == 2'
expect_json "warnings is list, whatsapp_missing present" 'isinstance(d["warnings"], list) and any(w["code"] == "whatsapp_missing" for w in d["warnings"])'
expect_json "recentOrders is list" 'isinstance(d["recentOrders"], list)'

req GET /api/v1/admin/menus
expect_status "GET /menus" 200
expect_json "menus list = 2" 'len(d) == 2 and d[0]["scheduleId"] is not None'

req GET "/api/v1/admin/categories?menuId=$FIRST_MENU"
expect_status "GET /categories?menuId" 200
expect_json "6 categories in first menu" 'len(d) == 6'
CAT_IDS="$(jget '",".join(c["id"] for c in d)')"
IFS=',' read -r -a CAT_ARR <<<"$CAT_IDS"

req POST /api/v1/admin/products "{\"categoryId\":\"$FIRST_CATEGORY\",\"name\":\"Тестовый латте\",\"priceMinor\":25000,\"tags\":[\"Тест\"],\"attributes\":[{\"label\":\"Объём\",\"value\":\"300 мл\"}]}"
expect_status "POST /products" 201
expect_json "slug transliterated" 'd["slug"] == "testovyy-latte" and d["priceMinor"] == 25000 and d["availability"] == "available"'
expect_json "nullables are null, not omitted" 'd["image"] is None and d["oldPriceMinor"] is None and "gifId" in d'
PRODUCT_ID="$(jget 'd["id"]')"

req POST /api/v1/admin/products '{"name":"","priceMinor":-1}'
expect_status "invalid product → 400" 400
expect_json "fields for categoryId/priceMinor" '"categoryId" in d["error"]["fields"]'

req PATCH "/api/v1/admin/products/$PRODUCT_ID" '{"name":"Тестовый латте XL","priceMinor":27000,"oldPriceMinor":30000}'
expect_status "PATCH /products/:id" 200
expect_json "patched fields" 'd["name"] == "Тестовый латте XL" and d["priceMinor"] == 27000 and d["oldPriceMinor"] == 30000'

req PATCH "/api/v1/admin/products/$PRODUCT_ID/availability" '{"availability":"hidden"}'
expect_status "PATCH availability → hidden" 200
expect_json "availability hidden" 'd["availability"] == "hidden"'

req GET "/api/v1/admin/products?categoryId=$FIRST_CATEGORY&availability=hidden"
expect_status "GET /products?availability=hidden" 200
expect_json "list view has menuName/categoryName" 'len(d) == 1 and d[0]["menuName"] != "" and d[0]["categoryName"] != ""'

req PATCH "/api/v1/admin/products/$PRODUCT_ID/availability" '{"availability":"available"}'
expect_status "PATCH availability → available" 200

REVERSED="$(python3 -c 'import sys; ids=sys.argv[1].split(","); print(",".join(f"\"{i}\"" for i in reversed(ids)))' "$CAT_IDS")"
req PUT /api/v1/admin/categories/reorder "{\"ids\":[$REVERSED]}"
expect_status "PUT /categories/reorder" 204
req GET "/api/v1/admin/categories?menuId=$FIRST_MENU"
expect_json "categories reversed" 'd[0]["id"] == "'"${CAT_ARR[5]}"'" and d[5]["id"] == "'"${CAT_ARR[0]}"'"'
ORIGINAL="$(python3 -c 'import sys; print(",".join(f"\"{i}\"" for i in sys.argv[1].split(",")))' "$CAT_IDS")"
req PUT /api/v1/admin/categories/reorder "{\"ids\":[$ORIGINAL]}"
expect_status "restore category order" 204

# ---------------------------------------------------------------------------
section "Media"
python3 - "$TMP/test.png" <<'PY'
import struct, sys, zlib
w, h = 1600, 1200
def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
row = bytes(c for x in range(w) for c in ((x * 255) // w, 96, 64))
raw = b"".join(b"\x00" + row for _ in range(h))
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b"")
open(sys.argv[1], "wb").write(png)
PY
req POST /api/v1/admin/media "" -F "file=@$TMP/test.png;type=image/png" -F "alt=Тестовая картинка"
expect_status "POST /media (png upload)" 201
expect_json "kind image, dimensions decoded" 'd["kind"] == "image" and d["mime"] == "image/png" and d["width"] == 1600 and d["height"] == 1200'
expect_json "thumbUrl/mediumUrl variants" 'd["url"].startswith("/uploads/") and "_thumb." in d["thumbUrl"] and "_medium." in d["mediumUrl"]'
expect_json "alt stored" 'd["alt"] == "Тестовая картинка" and d["originalName"] == "test.png"'
MEDIA_ID="$(jget 'd["id"]')"
THUMB_URL="$(jget 'd["thumbUrl"]')"

req GET "$THUMB_URL"
expect_status "GET thumb file" 200
expect_header "immutable cache header" '^cache-control: public, max-age=31536000, immutable'

req GET "/uploads/../.env"
[[ "$STATUS" == "404" || "$STATUS" == "400" ]] && pass "path traversal rejected" || fail "path traversal rejected"

printf 'not an image at all' >"$TMP/fake.png"
req POST /api/v1/admin/media "" -F "file=@$TMP/fake.png;type=image/png"
expect_status "sniffed non-image → 415" 415
expect_json "unsupported_media code" 'd["error"]["code"] == "unsupported_media"'

req GET "/api/v1/admin/media?kind=image&perPage=5"
expect_status "GET /media" 200
expect_json "paginated, contains upload" 'd["total"] >= 1 and d["perPage"] == 5 and any(m["id"] == "'"$MEDIA_ID"'" for m in d["items"])'

req PATCH "/api/v1/admin/products/$PRODUCT_ID" "{\"imageId\":\"$MEDIA_ID\"}"
expect_status "attach image to product" 200
expect_json "product.image populated" 'd["image"] is not None and d["image"]["id"] == "'"$MEDIA_ID"'"'

# ---------------------------------------------------------------------------
section "Settings & orders"
req GET /api/v1/admin/settings
expect_status "GET /settings" 200
expect_json "all keys present" 'all(k in d for k in ("business","contacts","orders","seo","status","theme"))'
ORDERS_JSON="$(jget 'json.dumps(d["orders"], ensure_ascii=False)')"

req GET /api/v1/admin/theme/presets
expect_status "GET /theme/presets" 200
expect_json "6 presets" 'len(d) == 6 and d[0]["id"] == "elegant"'

ORDERS_ON="$(python3 -c 'import json,sys; o=json.loads(sys.argv[1]); o.update(whatsappNumber="+49 151 23456789", blockWhenClosed=False, enabled=True); print(json.dumps(o, ensure_ascii=False))' "$ORDERS_JSON")"
req PUT /api/v1/admin/settings/orders "$ORDERS_ON"
expect_status "PUT /settings/orders (whatsapp on)" 200
expect_json "number stored" 'd["whatsappNumber"] == "+49 151 23456789"'

req GET /api/v1/site
expect_json "site: whatsappConfigured true" 'd["orders"]["whatsappConfigured"] is True'

req PUT /api/v1/admin/settings/orders '{"whatsappNumber":"abc"}'
expect_status "invalid whatsapp → 400" 400
expect_json "fields.whatsappNumber" '"whatsappNumber" in d["error"]["fields"]'

SAVED_TOKEN="$TOKEN"; TOKEN=""
req POST /api/v1/orders "{\"type\":\"takeaway\",\"customerName\":\"Иван\",\"comment\":\"без сахара\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}]}"
expect_status "POST /orders" 201
expect_json "whatsappUrl wa.me with digits" 'd["whatsappUrl"].startswith("https://wa.me/4915123456789?text=")'
expect_json "message per contract" 'd["message"].startswith("Новый заказ — Меренда\nЗаказ №") and "Тип: На вынос" in d["message"] and "Имя: Иван" in d["message"] and "× 2 — 540 ₽" in d["message"] and "Итого: 540 ₽" in d["message"] and "Комментарий: без сахара" in d["message"]'
expect_json "order re-priced server-side" 'd["order"]["totalMinor"] == 54000 and d["order"]["items"][0]["priceMinor"] == 27000 and d["order"]["status"] == "new"'
expect_json "encoded text uses %20" '"%20" in d["whatsappUrl"] and "+" not in d["whatsappUrl"].split("?text=")[1]'
ORDER_ID="$(jget 'd["order"]["id"]')"

req POST /api/v1/orders '{"type":"takeaway","items":[]}'
expect_status "empty items → 400" 400
expect_json "fields.items" 'd["error"]["code"] == "validation_error" and "items" in d["error"]["fields"]'

req POST /api/v1/orders "{\"type\":\"delivery\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":100}]}"
expect_status "bad type/quantity → 400" 400
expect_json "fields.type + fields.items" '"type" in d["error"]["fields"] and "items" in d["error"]["fields"]'
TOKEN="$SAVED_TOKEN"

req GET "/api/v1/admin/orders?status=new"
expect_status "GET /orders" 200
expect_json "created order listed" 'any(o["id"] == "'"$ORDER_ID"'" for o in d["items"]) and d["total"] >= 1'

req PATCH "/api/v1/admin/orders/$ORDER_ID/status" '{"status":"confirmed"}'
expect_status "PATCH /orders/:id/status" 200
expect_json "status confirmed" 'd["status"] == "confirmed" and len(d["items"]) == 1'

req PATCH "/api/v1/admin/orders/$ORDER_ID/status" '{"status":"bogus"}'
expect_status "invalid status → 400" 400

req PUT /api/v1/admin/settings/orders "$ORDERS_JSON"
expect_status "PUT /settings/orders (restore, whatsapp empty)" 200
expect_json "number cleared" 'd["whatsappNumber"] == ""'

# ---------------------------------------------------------------------------
section "Schedules & sections"
req GET /api/v1/admin/schedules
expect_status "GET /schedules" 200
expect_json "venue first" 'd[0]["kind"] == "venue" and len(d[0]["hours"]) == 7'
VENUE_ID="$(jget 'd[0]["id"]')"
VENUE_HOURS="$(jget 'json.dumps({"hours": d[0]["hours"]})')"

NEW_HOURS="$(python3 -c 'import json; print(json.dumps({"hours":[{"weekday":i,"isClosed":i==6,"opensAt":"08:30","closesAt":"23:00"} for i in range(7)]}))')"
req PUT "/api/v1/admin/schedules/$VENUE_ID/hours" "$NEW_HOURS"
expect_status "PUT /schedules/:id/hours" 200
expect_json "hours applied" 'd["hours"][0]["closesAt"] == "23:00" and d["hours"][6]["isClosed"] is True'

req PUT "/api/v1/admin/schedules/$VENUE_ID/hours" '{"hours":[{"weekday":0,"isClosed":false,"opensAt":"8:00","closesAt":"22:00"}]}'
expect_status "invalid hours → 400" 400

req PUT "/api/v1/admin/schedules/$VENUE_ID/hours" "$VENUE_HOURS"
expect_status "restore venue hours" 200

req DELETE "/api/v1/admin/schedules/$VENUE_ID"
expect_status "delete venue → 409" 409

req GET /api/v1/admin/sections
expect_status "GET /sections" 200
expect_json "11 sections incl. disabled" 'len(d) == 11'
HERO_ID="$(jget '[s["id"] for s in d if s["type"] == "hero"][0]')"
HERO_TITLE="$(jget '[s["title"] for s in d if s["type"] == "hero"][0]')"
ABOUT_ID="$(jget '[s["id"] for s in d if s["type"] == "about"][0]')"
FOOTER_ID="$(jget '[s["id"] for s in d if s["type"] == "footer"][0]')"
SECTION_ORDER="$(jget '",".join(s["id"] for s in d)')"

req PATCH "/api/v1/admin/sections/$HERO_ID" '{"title":"Главный экран (smoke)","settings":{"title":"Привет","layout":"split"}}'
expect_status "PATCH /sections/:id" 200
expect_json "section patched" 'd["title"] == "Главный экран (smoke)" and d["settings"]["layout"] == "split"'

req PUT /api/v1/admin/sections/reorder "{\"ids\":[\"$FOOTER_ID\",\"$ABOUT_ID\",\"$HERO_ID\"]}"
expect_status "PUT /sections/reorder" 204
req GET /api/v1/admin/sections
expect_json "header first, footer last, about before hero" 'd[0]["type"] == "header" and d[-1]["type"] == "footer" and [s["type"] for s in d].index("about") < [s["type"] for s in d].index("hero")'

req POST /api/v1/admin/sections '{"type":"hero"}'
expect_status "duplicate unique section → 409" 409
req DELETE "/api/v1/admin/sections/$FOOTER_ID"
expect_status "delete locked section → 409" 409

RESTORE_ORDER="$(python3 -c 'import sys; print(",".join(f"\"{i}\"" for i in sys.argv[1].split(",")))' "$SECTION_ORDER")"
req PUT /api/v1/admin/sections/reorder "{\"ids\":[$RESTORE_ORDER]}"
expect_status "restore section order" 204
req PATCH "/api/v1/admin/sections/$HERO_ID" "{\"title\":\"$HERO_TITLE\",\"settings\":{}}"
expect_status "restore hero section" 200

# ---------------------------------------------------------------------------
section "Cleanup"
req DELETE "/api/v1/admin/orders/$ORDER_ID"
expect_status "DELETE /orders/:id" 204
req DELETE "/api/v1/admin/products/$PRODUCT_ID"
expect_status "DELETE /products/:id" 204
req DELETE "/api/v1/admin/media/$MEDIA_ID"
expect_status "DELETE /media/:id" 204
req GET "$THUMB_URL"
expect_status "thumb file removed" 404
req GET "/api/v1/admin/products/$PRODUCT_ID"
expect_status "deleted product → 404" 404

# ---------------------------------------------------------------------------
section "Logout"
req POST /api/v1/admin/auth/logout
expect_status "POST /auth/logout" 204
expect_header "cookie cleared" '^set-cookie: merenda_refresh=;.*Max-Age=0'
req POST /api/v1/admin/auth/refresh
expect_status "refresh after logout → 401" 401
req GET /api/v1/admin/auth/me
expect_status "access token revoked → 401" 401

# ---------------------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
