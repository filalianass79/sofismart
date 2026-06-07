import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { depotFilter } from "@/lib/warehouse/depot-scope";

export async function GET() {
  const gate = await warehouseSessionScope("warehouse.pending_deliveries.view");
  if ("response" in gate) return gate.response;

  if (!gate.scope.isAdmin && !gate.scope.depotIds?.length) {
    return NextResponse.json([]);
  }

  const rows = await prisma.exitVoucher.findMany({
    where: {
      status: "PENDING",
      ...depotFilter(gate.scope),
    },
    orderBy: { generatedAt: "desc" },
    include: {
      sale: { select: { reference: true } },
      vehicle: { include: { brand: true, carModel: true } },
      depot: { select: { name: true } },
    },
  });

  return NextResponse.json(rows);
}
