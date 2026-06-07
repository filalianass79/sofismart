import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import {
  getWarehouseStats,
  getPendingDeliveries,
  getDepotVehicles,
  getDeliveryHistory,
} from "@/lib/services/warehouse-dashboard-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const gate = await warehouseSessionScope("warehouse.dashboard.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as "day" | "week" | "month") || "month";

  const [stats, pending, vehicles, history, depot] = await Promise.all([
    getWarehouseStats(gate.scope),
    getPendingDeliveries(gate.scope, { q: searchParams.get("q") ?? undefined }),
    getDepotVehicles(gate.scope, { q: searchParams.get("vehicleQ") ?? undefined }),
    getDeliveryHistory(gate.scope, period),
    gate.scope.userDepotId
      ? prisma.depot.findUnique({
          where: { id: gate.scope.userDepotId },
          select: { id: true, name: true, city: true },
        })
      : null,
  ]);

  return NextResponse.json({ stats, pending, vehicles, history, depot });
}
