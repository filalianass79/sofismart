#!/usr/bin/env bash
# Déploiement SOFISMART sur AWS Lightsail Ubuntu
# Usage : ./scripts/deploy-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE=".env.production"
ENV_EXAMPLE=".env.production.example"
COMPOSE="docker compose --env-file $ENV_FILE"
COMPOSE_MIGRATE="docker compose --env-file $ENV_FILE --profile migrate"

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

if grep -q "CHANGE_ME" "$ENV_FILE" || grep -q "CHANGE_PASSWORD" "$ENV_FILE"; then
  echo "ERREUR : $ENV_FILE contient encore des valeurs par défaut (CHANGE_ME...)." >&2
  echo "Éditez le fichier avant de déployer." >&2
  exit 1
fi

# --- Build ---
echo ">> Build images Docker..."
$COMPOSE_MIGRATE build --no-cache

# --- Base de données ---
echo ">> Démarrage PostgreSQL..."
$COMPOSE up -d db

echo ">> Attente PostgreSQL..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U "${POSTGRES_USER:-sofismart_user}" -d "${POSTGRES_DB:-sofismart}" >/dev/null 2>&1; then
    echo "   PostgreSQL OK"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERREUR : PostgreSQL ne répond pas." >&2
    $COMPOSE logs db --tail 30
    exit 1
  fi
  sleep 2
done

# --- Migrations (image builder = Prisma complet) ---
echo ">> Migrations base de données..."
$COMPOSE_MIGRATE run --rm --build migrator npx prisma migrate deploy

if grep -q "RUN_SEED_ON_START=true" "$ENV_FILE"; then
  echo ">> Seed admin initial..."
  $COMPOSE_MIGRATE run --rm --build migrator npx prisma db seed
fi

# --- Application ---
echo ">> Démarrage application..."
$COMPOSE up -d app

echo ">> Attente santé application (max 120s)..."
for i in $(seq 1 24); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "   Application OK"
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "ERREUR : l'application ne répond pas. Logs :" >&2
    $COMPOSE logs app --tail 50
    exit 1
  fi
  sleep 5
done

# --- Désactiver seed après premier déploiement ---
if grep -q "RUN_SEED_ON_START=true" "$ENV_FILE"; then
  echo ">> Premier déploiement — désactivation auto du seed..."
  sed -i 's/RUN_SEED_ON_START=true/RUN_SEED_ON_START=false/' "$ENV_FILE"
  sed -i 's/RUN_MIGRATIONS_ON_START=true/RUN_MIGRATIONS_ON_START=false/' "$ENV_FILE"
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
echo "  ./scripts/migrate-db.sh"
echo "  ./scripts/backup-db.sh"
