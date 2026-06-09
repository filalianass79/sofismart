#!/bin/sh
set -e

UPLOAD_ROOT="${UPLOAD_DIR:-public/uploads}"

for subdir in \
  documents pdfs images invoice-imports \
  company/logo company/header company/footer \
  catalog delivery-signed delivery-notes proformas; do
  mkdir -p "${UPLOAD_ROOT}/${subdir}"
done

if [ "$RUN_MIGRATIONS_ON_START" = "true" ]; then
  echo ">> prisma migrate deploy"
  npx prisma migrate deploy
fi

if [ "$RUN_SEED_ON_START" = "true" ]; then
  echo ">> prisma db seed (SEED_MODE=${SEED_MODE:-production})"
  npx prisma db seed
fi

exec "$@"
