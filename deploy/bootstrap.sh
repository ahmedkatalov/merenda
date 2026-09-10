#!/usr/bin/env bash
# Prepare a fresh Ubuntu 22.04 server for Merenda: Docker Engine + Compose
# plugin, a 2 GB swap file (safety margin for image builds on 4 GB RAM), and a
# minimal UFW firewall (22/80/443). Idempotent — safe to run more than once.
#
#   sudo bash deploy/bootstrap.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "Run with sudo/root." >&2; exit 1; fi

echo "== apt update =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw

if ! command -v docker >/dev/null 2>&1; then
  echo "== installing Docker =="
  curl -fsSL https://get.docker.com | sh
else
  echo "Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin missing — reinstalling via get.docker.com"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version

# 2 GB swap (skip if any swap already active)
if [[ "$(swapon --show --noheadings | wc -l)" -eq 0 ]]; then
  echo "== creating 2 GB swap =="
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "Swap already present — skipping."
fi

echo "== firewall (UFW): allow 22, 80, 443 =="
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo
echo "Bootstrap complete. Next: put the code in /opt/merenda, create .env, then"
echo "  cd /opt/merenda && docker compose up -d --build"
