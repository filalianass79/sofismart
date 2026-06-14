/**
 * Met à jour templates et paramètres WhatsApp production.
 *
 * Usage serveur :
 *   docker compose --env-file .env.production --profile migrate run --rm migrator npx tsx prisma/seed-whatsapp-only.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: process.env.ENV_FILE ?? ".env.production", override: true });
dotenv.config({ override: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedWhatsAppSettings, seedWhatsAppTemplates } from "./seed-whatsapp";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL manquant.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await seedWhatsAppTemplates(prisma);
    await seedWhatsAppSettings(prisma);
    console.log("✓ Templates et paramètres WhatsApp mis à jour.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
