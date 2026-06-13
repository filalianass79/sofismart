/**
 * Met à jour les modèles e-mail et paramètres de notification (sans toucher aux utilisateurs).
 *
 * Usage serveur :
 *   ./scripts/seed-emails-only.sh
 *   docker compose --env-file .env.production --profile migrate build migrator
 *   docker compose --env-file .env.production --profile migrate run --rm migrator npx tsx prisma/seed-emails-only.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: process.env.ENV_FILE ?? ".env.production", override: true });
dotenv.config({ override: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedEmails } from "./seed-emails";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL manquant.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await seedEmails(prisma);
    console.log("✓ Modèles e-mail et paramètres notification mis à jour.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
