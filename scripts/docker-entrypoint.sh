#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS_ON_START" = "true" ]; then
  echo ">> prisma migrate deploy"
  npx prisma migrate deploy
fi

if [ "$RUN_SEED_ON_START" = "true" ]; then
  echo ">> prisma db seed (SEED_MODE=${SEED_MODE:-production})"
  npx prisma db seed
fi

exec "$@"
