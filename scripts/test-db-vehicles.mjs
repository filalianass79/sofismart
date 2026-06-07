import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const vehicleCount = await prisma.vehicle.count();
  console.log("vehicles:", vehicleCount);
  const depots = await prisma.depot.findMany({ where: { status: "ACTIVE" } });
  console.log("active depots:", depots.length);
  const list = await prisma.vehicle.findMany({
    where: { isArchived: false },
    take: 3,
    include: { brand: true, carModel: true, depot: true, purchase: true, sale: true },
  });
  console.log("sample:", list.map((v) => v.internalRef));
} catch (e) {
  console.error("ERROR:", e.message);
  if (e.code) console.error("code:", e.code);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
