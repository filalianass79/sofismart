#!/usr/bin/env bash
# Migrations + seed PostgreSQL (conteneur migrator avec Prisma complet)
# Usage : ./scripts/migrate-db.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE --profile migrate"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier $ENV_FILE introuvable" >&2
  exit 1
fi

echo ">> Build image migrator (code à jour)"
$COMPOSE build migrator

echo ">> prisma migrate deploy"
$COMPOSE run --rm migrator npx prisma migrate deploy

if grep -q "RUN_SEED_ON_START=true" "$ENV_FILE"; then
  echo ">> prisma db seed"
  $COMPOSE run --rm migrator npx prisma db seed
fi

echo ">> Migrations terminées."
