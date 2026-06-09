#!/usr/bin/env bash
# Restauration PostgreSQL + uploads SOFISMART
# Usage : ./scripts/restore-db.sh backups/sofismart_db_20260101_120000.sql.gz [uploads.tar.gz]
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <fichier.sql.gz> [fichier_uploads.tar.gz]" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SQL_FILE="$1"
UPLOADS_FILE="${2:-}"
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier $ENV_FILE introuvable" >&2
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "Fichier SQL introuvable : $SQL_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source <(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$ENV_FILE" | sed 's/^/export /')

DB_USER="${POSTGRES_USER:-sofismart_user}"
DB_NAME="${POSTGRES_DB:-sofismart}"

echo "ATTENTION : cette opération écrase la base $DB_NAME"
read -r -p "Continuer ? (oui/non) " confirm
if [ "$confirm" != "oui" ]; then
  echo "Annulé."
  exit 0
fi

echo ">> Arrêt application..."
$COMPOSE stop app

echo ">> Restauration base..."
gunzip -c "$SQL_FILE" | $COMPOSE exec -T db \
  psql -U "$DB_USER" -d "$DB_NAME" --single-transaction

if [ -n "$UPLOADS_FILE" ] && [ -f "$UPLOADS_FILE" ]; then
  echo ">> Restauration uploads..."
  cat "$UPLOADS_FILE" | $COMPOSE exec -T app tar xzf - -C /app/public/uploads
fi

echo ">> Redémarrage application..."
$COMPOSE start app

echo ">> Restauration terminée."
