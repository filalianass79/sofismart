#!/usr/bin/env bash
# Met à jour les modèles e-mail en base (rebuild migrator pour inclure le code à jour).
#
# Usage (depuis /opt/sofismart) :
#   chmod +x scripts/seed-emails-only.sh
#   ./scripts/seed-emails-only.sh
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

echo ">> Mise à jour modèles e-mail"
$COMPOSE run --rm migrator npx tsx prisma/seed-emails-only.ts

echo ">> Terminé."
