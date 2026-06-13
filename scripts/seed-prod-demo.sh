#!/usr/bin/env bash
# Injecte des données de démo en production (fournisseurs, clients, véhicules, achats).
# À exécuter sur le serveur depuis la racine du projet (/opt/sofismart).
#
# Usage :
#   chmod +x scripts/seed-prod-demo.sh
#   ALLOW_PROD_DEMO_SEED=true ./scripts/seed-prod-demo.sh
#
# Optionnel : PROD_DEMO_COUNT=15 pour plus d'entrées (max 30).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE --profile migrate"

if [ "${ALLOW_PROD_DEMO_SEED:-}" != "true" ]; then
  echo "Erreur : ALLOW_PROD_DEMO_SEED=true est requis pour confirmer l'opération." >&2
  echo "Exemple : ALLOW_PROD_DEMO_SEED=true ./scripts/seed-prod-demo.sh" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier $ENV_FILE introuvable" >&2
  exit 1
fi

echo ">> Build image migrator (code à jour)"
$COMPOSE build migrator

echo ">> Injection données démo production"
$COMPOSE run --rm \
  -e ALLOW_PROD_DEMO_SEED=true \
  -e "PROD_DEMO_COUNT=${PROD_DEMO_COUNT:-10}" \
  migrator npx tsx scripts/seed-prod-demo.ts

echo ">> Données démo injectées."
