#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

TAG="${1:-${TAG:-}}"
if [[ -z "$TAG" ]]; then
  echo "usage: ./deploy.sh <tag>" >&2
  exit 1
fi
export TAG

if [[ ! -f .env ]]; then
  echo ".env not found in $(pwd)" >&2
  exit 1
fi

set -a
APP_DOMAIN="$(grep -E '^APP_DOMAIN=' .env | tail -n1 | cut -d= -f2- | tr -d '"')"
set +a
export APP_DOMAIN

echo "==> Pulling images for $TAG"
docker compose pull app caddy
docker compose --profile migrate pull migrate

echo "==> Running database migrations"
docker compose --profile migrate run --rm migrate

echo "==> Starting containers"
docker compose up -d --wait --wait-timeout 180 app caddy

if [[ -f .current_tag ]]; then
  cp .current_tag .previous_tag
fi
echo "$TAG" > .current_tag

echo "==> Cleaning up old images"
docker image prune -af --filter "until=168h" >/dev/null || true

echo "==> Deployed $TAG"
