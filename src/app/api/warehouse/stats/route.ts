import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { getWarehouseStats } from "@/lib/services/warehouse-dashboard-service";

export async function GET() {
  const gate = await warehouseSessionScope("warehouse.dashboard.view");
  if ("response" in gate) return gate.response;
  const stats = await getWarehouseStats(gate.scope);
  return NextResponse.json(stats);
}
