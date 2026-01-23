#!/bin/sh
set -e

echo "[INFO] Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  echo "[ERROR] DATABASE_URL is not set"
  exit 1
fi

echo "[INFO] Running Prisma migrations..."
pnpm prisma migrate deploy

echo "[INFO] Starting server..."
exec node dist/server.js
