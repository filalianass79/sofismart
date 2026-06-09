#!/usr/bin/env bash
# Sauvegarde PostgreSQL + uploads SOFISMART
# Usage : ./scripts/backup-db.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier $ENV_FILE introuvable" >&2
  exit 1
fi

# shellcheck disable=SC1090
source <(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$ENV_FILE" | sed 's/^/export /')

DB_USER="${POSTGRES_USER:-sofismart_user}"
DB_NAME="${POSTGRES_DB:-sofismart}"

SQL_FILE="$BACKUP_DIR/sofismart_db_${TIMESTAMP}.sql.gz"
UPLOADS_FILE="$BACKUP_DIR/sofismart_uploads_${TIMESTAMP}.tar.gz"

echo ">> Sauvegarde base de données..."
$COMPOSE exec -T db \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
  | gzip > "$SQL_FILE"

echo ">> Sauvegarde uploads..."
$COMPOSE exec -T app tar czf - -C /app/public/uploads . > "$UPLOADS_FILE"

echo ">> Terminé :"
echo "   $SQL_FILE ($(du -h "$SQL_FILE" | cut -f1))"
echo "   $UPLOADS_FILE ($(du -h "$UPLOADS_FILE" | cut -f1))"

# Garder les 14 dernières sauvegardes de chaque type
ls -1t "$BACKUP_DIR"/sofismart_db_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -1t "$BACKUP_DIR"/sofismart_uploads_*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
