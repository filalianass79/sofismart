/**
 * Migre les colonnes Vehicle.brand / Vehicle.model vers Brand + VehicleModel.
 * À exécuter une fois avant `prisma db push` si la BDD contient encore brand/model (texte).
 */
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  const hasLegacy = await columnExists("Vehicle", "brand");
  if (!hasLegacy) {
    console.log("Colonnes legacy brand/model absentes — rien à migrer.");
    await pool.end();
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Brand" (
      "id" TEXT PRIMARY KEY,
      "label" TEXT NOT NULL UNIQUE,
      "logo" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "VehicleModel" (
      "id" TEXT PRIMARY KEY,
      "label" TEXT NOT NULL,
      "brandId" TEXT NOT NULL REFERENCES "Brand"("id") ON DELETE CASCADE,
      "photo" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("brandId", "label")
    );
  `);

  const { rows: vehicles } = await pool.query(
    `SELECT id, brand, model FROM "Vehicle" WHERE brand IS NOT NULL AND model IS NOT NULL`
  );

  const brandMap = new Map();
  for (const v of vehicles) {
    const key = v.brand.trim();
    if (!brandMap.has(key)) {
      const id = `mig-brand-${brandMap.size + 1}`;
      await pool.query(`INSERT INTO "Brand" (id, label, "updatedAt") VALUES ($1, $2, NOW()) ON CONFLICT (label) DO NOTHING`, [
        id,
        key,
      ]);
      const { rows } = await pool.query(`SELECT id FROM "Brand" WHERE label = $1`, [key]);
      brandMap.set(key, rows[0].id);
    }
  }

  const modelMap = new Map();
  for (const v of vehicles) {
    const bId = brandMap.get(v.brand.trim());
    const mKey = `${bId}::${v.model.trim()}`;
    if (!modelMap.has(mKey)) {
      const id = `mig-model-${modelMap.size + 1}`;
      await pool.query(
        `INSERT INTO "VehicleModel" (id, label, "brandId", "updatedAt") VALUES ($1, $2, $3, NOW())
         ON CONFLICT ("brandId", label) DO NOTHING`,
        [id, v.model.trim(), bId]
      );
      const { rows } = await pool.query(`SELECT id FROM "VehicleModel" WHERE "brandId" = $1 AND label = $2`, [
        bId,
        v.model.trim(),
      ]);
      modelMap.set(mKey, rows[0].id);
    }
  }

  if (!(await columnExists("Vehicle", "brandId"))) {
    await pool.query(`ALTER TABLE "Vehicle" ADD COLUMN "brandId" TEXT, ADD COLUMN "modelId" TEXT`);
  }
  if (!(await columnExists("Vehicle", "matriculeW"))) {
    await pool.query(`ALTER TABLE "Vehicle" ADD COLUMN "matriculeW" TEXT`);
  }

  for (const v of vehicles) {
    const bId = brandMap.get(v.brand.trim());
    const mId = modelMap.get(`${bId}::${v.model.trim()}`);
    await pool.query(`UPDATE "Vehicle" SET "brandId" = $1, "modelId" = $2 WHERE id = $3`, [bId, mId, v.id]);
  }

  // Normaliser fuel / transmission vers enums si colonnes texte
  await pool.query(`
    UPDATE "Vehicle" SET fuel = 'DIESEL' WHERE fuel ILIKE '%diesel%';
    UPDATE "Vehicle" SET fuel = 'ESSENCE' WHERE fuel ILIKE '%essence%';
    UPDATE "Vehicle" SET fuel = 'HYBRIDE' WHERE fuel ILIKE '%hybride%';
    UPDATE "Vehicle" SET fuel = 'ELECTRIQUE' WHERE fuel ILIKE '%elect%';
    UPDATE "Vehicle" SET transmission = 'AUTOMATIQUE' WHERE transmission ILIKE '%auto%';
    UPDATE "Vehicle" SET transmission = 'MANUELLE' WHERE transmission ILIKE '%manuel%';
  `).catch(() => {});

  console.log(`Migré ${vehicles.length} véhicule(s). Exécutez ensuite: npx prisma db push`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
