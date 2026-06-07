/**
 * Signale les achats sans véhicule lié (données historiques à ressaisir).
 * Usage: node --env-file=.env scripts/repair-purchase-vehicles.mjs
 */
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const orphans = await prisma.purchase.findMany({
  where: { vehicleId: null },
  select: { id: true, reference: true, status: true },
});

const vehicleCount = await prisma.vehicle.count({ where: { isArchived: false } });
const purchaseWithVehicle = await prisma.purchase.count({ where: { vehicleId: { not: null } } });

console.log({
  activeVehicles: vehicleCount,
  purchasesWithVehicle: purchaseWithVehicle,
  purchasesWithoutVehicle: orphans.length,
});

if (orphans.length > 0) {
  console.log("Achats sans véhicule (à compléter via modification achat) :");
  for (const p of orphans) console.log(`  - ${p.reference} (${p.status})`);
}

await prisma.$disconnect();
await pool.end();
