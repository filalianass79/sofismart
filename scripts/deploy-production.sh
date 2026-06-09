#!/usr/bin/env bash
# Déploiement SOFISMART sur AWS Lightsail Ubuntu
# Usage : ./scripts/deploy-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE=".env.production"
ENV_EXAMPLE=".env.production.example"

echo "========================================"
echo " SOFISMART — Déploiement production"
echo "========================================"

# --- Vérifications ---
command -v docker >/dev/null 2>&1 || { echo "Docker requis"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose requis"; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
  echo ">> Création $ENV_FILE depuis l'exemple..."
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "   Éditez $ENV_FILE (mots de passe, secrets, SMTP) puis relancez."
  exit 1
fi

# Vérifier que les secrets ne sont pas les valeurs par défaut
if grep -q "CHANGE_ME" "$ENV_FILE" || grep -q "CHANGE_PASSWORD" "$ENV_FILE"; then
  echo "ERREUR : $ENV_FILE contient encore des valeurs par défaut (CHANGE_ME...)." >&2
  echo "Éditez le fichier avant de déployer." >&2
  exit 1
fi

# --- Build & démarrage ---
echo ">> Build image Docker..."
docker compose --env-file "$ENV_FILE" build --no-cache

echo ">> Démarrage services..."
docker compose --env-file "$ENV_FILE" up -d

echo ">> Attente santé application (max 120s)..."
for i in $(seq 1 24); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "   Application OK"
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "ERREUR : l'application ne répond pas. Logs :" >&2
    docker compose --env-file "$ENV_FILE" logs app --tail 50
    exit 1
  fi
  sleep 5
done

# --- Désactiver migrations/seed après premier déploiement ---
if grep -q "RUN_MIGRATIONS_ON_START=true" "$ENV_FILE"; then
  echo ">> Premier déploiement détecté — désactivation auto migrations/seed..."
  sed -i 's/RUN_MIGRATIONS_ON_START=true/RUN_MIGRATIONS_ON_START=false/' "$ENV_FILE"
  sed -i 's/RUN_SEED_ON_START=true/RUN_SEED_ON_START=false/' "$ENV_FILE"
  docker compose --env-file "$ENV_FILE" up -d
fi

# --- Nginx (si installé) ---
if command -v nginx >/dev/null 2>&1 && [ -f nginx/sofismart.conf ]; then
  echo ">> Configuration Nginx..."
  sudo cp nginx/sofismart.conf /etc/nginx/sites-available/sofismart 2>/dev/null || true
  sudo ln -sf /etc/nginx/sites-available/sofismart /etc/nginx/sites-enabled/sofismart 2>/dev/null || true
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || \
    echo "   Nginx : configurez manuellement (voir DEPLOYMENT-AWS-LIGHTSAIL.md)"
fi

echo ""
echo "========================================"
echo " Déploiement terminé"
echo " App      : http://127.0.0.1:3000"
echo " Health   : http://127.0.0.1:3000/api/health"
echo " Domaine  : https://app.sofismart.com (après Nginx + Certbot)"
echo "========================================"
echo ""
echo "Commandes utiles :"
echo "  docker compose --env-file .env.production logs -f app"
echo "  ./scripts/backup-db.sh"
echo "  docker compose --env-file .env.production pull && docker compose --env-file .env.production up -d --build"
