import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    where: { OR: [{ brandId: null }, { modelId: null }] },
    select: { id: true, brandLegacy: true, modelLegacy: true },
  });

  for (const v of vehicles) {
    const brandLabel = v.brandLegacy?.trim();
    const modelLabel = v.modelLegacy?.trim();
    if (!brandLabel || !modelLabel) continue;

    const brand = await prisma.brand.upsert({
      where: { label: brandLabel },
      update: {},
      create: { label: brandLabel },
    });
    const carModel = await prisma.vehicleModel.upsert({
      where: { brandId_label: { brandId: brand.id, label: modelLabel } },
      update: {},
      create: { brandId: brand.id, label: modelLabel },
    });
    await prisma.vehicle.update({
      where: { id: v.id },
      data: { brandId: brand.id, modelId: carModel.id },
    });
  }

  console.log(`Backfill terminé (${vehicles.length} véhicule(s) traités).`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
