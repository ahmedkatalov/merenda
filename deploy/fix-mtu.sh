#!/usr/bin/env bash
# Fix a PMTUD blackhole on a reduced-MTU cloud overlay: clamp TCP MSS so neither
# side ever emits a packet too big for the path (works without relying on ICMP).
# Run on the server: bash /opt/merenda/deploy/fix-mtu.sh
set -euo pipefail

echo "== Current interface MTUs =="
ip -br link 2>/dev/null | awk '{print $1, $NF}' || ip link | grep mtu

echo
echo "== Installing TCP MSS clamp (both handshake directions) =="
# Docker-forwarded traffic (site/admin/api/caddy containers).
iptables -t mangle -C FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1360 2>/dev/null \
  || iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1360
# Traffic terminating on the host itself (e.g. sshd).
iptables -t mangle -C OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1360 2>/dev/null \
  || iptables -t mangle -A OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1360
echo "MSS clamp active."

echo
echo "== Lower host primary interface MTU to 1400 as well (belt and suspenders) =="
IFACE="$(ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev"){print $(i+1); exit}}')"
if [ -n "${IFACE:-}" ]; then
  echo "primary iface: $IFACE"
  ip link set dev "$IFACE" mtu 1400 || echo "(could not change MTU, MSS clamp still applies)"
fi

echo
echo "== Make the MSS clamp persist across reboots =="
cat > /etc/systemd/system/merenda-mssclamp.service <<'UNIT'
[Unit]
Description=Merenda TCP MSS clamp (PMTUD blackhole workaround)
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/sbin/iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1360
ExecStart=/sbin/iptables -t mangle -A OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1360
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable merenda-mssclamp.service >/dev/null 2>&1 || true

echo
echo "== Restarting Caddy to retry certificate now =="
cd /opt/merenda && docker compose restart caddy
echo
echo "DONE. Watch certs with:  cd /opt/merenda && docker compose logs -f caddy"
