import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Incrémenter après modification du schéma Prisma pour recréer le client en dev
 * (évite un PrismaClient mis en cache sans les nouveaux champs après hot-reload).
 */
const PRISMA_CACHE_KEY = "proforma-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquant");
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma && globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY) {
    return globalForPrisma.prisma;
  }
  const client = createPrisma();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY;
  return client;
}

export const prisma = getPrisma();
