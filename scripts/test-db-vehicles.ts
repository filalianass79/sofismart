import { prisma } from "../src/lib/prisma";
import { listVehiclesForUi } from "../src/lib/vehicles-list-query";

async function main() {
  try {
    const vehicleCount = await prisma.vehicle.count();
    console.log("vehicles:", vehicleCount);
    const depots = await prisma.depot.findMany({ where: { status: "ACTIVE" } });
    console.log("active depots:", depots.length);
    const list = await listVehiclesForUi();
    console.log("list count:", list.length);
    if (list[0]) console.log("first:", list[0].internalRef);
  } catch (e) {
    const err = e as Error & { code?: string };
    console.error("ERROR:", err.message);
    if (err.code) console.error("code:", err.code);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
