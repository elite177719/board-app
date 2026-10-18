#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-localhost}"
SSL_DIR="${2:-/etc/nginx/ssl}"
CRT_PATH="${SSL_DIR}/board-app-selfsigned.crt"
KEY_PATH="${SSL_DIR}/board-app-selfsigned.key"

sudo mkdir -p "${SSL_DIR}"
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${KEY_PATH}" \
  -out "${CRT_PATH}" \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=BoardApp/CN=${DOMAIN}"

echo "Created:"
echo "  ${CRT_PATH}"
echo "  ${KEY_PATH}"
