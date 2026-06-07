import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { getDepotVehicles } from "@/lib/services/warehouse-dashboard-service";

export async function GET(req: Request) {
  const gate = await warehouseSessionScope("warehouse.vehicles.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const rows = await getDepotVehicles(gate.scope, {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    brandId: searchParams.get("brandId") ?? undefined,
    modelId: searchParams.get("modelId") ?? undefined,
    origin: searchParams.get("origin") ?? undefined,
  });

  return NextResponse.json(rows);
}
