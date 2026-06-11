#!/usr/bin/env bash
# Active l'extraction IA sur le serveur Lightsail SOFISMART
# Usage : ./scripts/enable-ai-production.sh [openai|claude|gemini]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE=".env.production"
PROVIDER="${1:-openai}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERREUR : $ENV_FILE introuvable. Copiez .env.production.example d'abord." >&2
  exit 1
fi

echo ">> Activation IA — provider : $PROVIDER"

# Activer le flag global
if grep -q "^AI_EXTRACTION_ENABLED=" "$ENV_FILE"; then
  sed -i 's/^AI_EXTRACTION_ENABLED=.*/AI_EXTRACTION_ENABLED=true/' "$ENV_FILE"
else
  echo "AI_EXTRACTION_ENABLED=true" >> "$ENV_FILE"
fi

# Provider
if grep -q "^AI_PROVIDER=" "$ENV_FILE"; then
  sed -i "s/^AI_PROVIDER=.*/AI_PROVIDER=$PROVIDER/" "$ENV_FILE"
else
  echo "AI_PROVIDER=$PROVIDER" >> "$ENV_FILE"
fi

# Modèle par défaut selon provider
case "$PROVIDER" in
  claude|anthropic)
    DEFAULT_MODEL="claude-3-5-haiku-latest"
    KEY_VAR="ANTHROPIC_API_KEY"
    ;;
  gemini|google)
    DEFAULT_MODEL="gemini-2.0-flash"
    KEY_VAR="GEMINI_API_KEY"
    ;;
  *)
    DEFAULT_MODEL="gpt-4o-mini"
    KEY_VAR="OPENAI_API_KEY"
    PROVIDER="openai"
    sed -i "s/^AI_PROVIDER=.*/AI_PROVIDER=openai/" "$ENV_FILE"
    ;;
esac

if ! grep -q "^AI_MODEL=" "$ENV_FILE"; then
  echo "AI_MODEL=$DEFAULT_MODEL" >> "$ENV_FILE"
fi

echo ""
echo "=========================================="
echo " Étape suivante — ajoutez votre clé API"
echo "=========================================="
echo ""
echo "  nano $ENV_FILE"
echo ""
echo "  Ajoutez ou modifiez :"
echo "    $KEY_VAR=votre-cle-api"
echo "    # ou AI_API_KEY=votre-cle-api (universel)"
echo ""
echo "  Modèles recommandés :"
echo "    openai  → gpt-4o-mini"
echo "    claude  → claude-3-5-haiku-latest"
echo "    gemini  → gemini-2.0-flash"
echo ""
echo "Puis redéployez :"
echo "  docker compose --env-file .env.production up -d --build"
echo "  docker compose --env-file .env.production --profile migrate run --rm migrator npx prisma migrate deploy"
echo ""
