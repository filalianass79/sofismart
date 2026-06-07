import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { getPendingDeliveries } from "@/lib/services/warehouse-dashboard-service";

export async function GET(req: Request) {
  const gate = await warehouseSessionScope("warehouse.pending_deliveries.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const rows = await getPendingDeliveries(gate.scope, {
    q: searchParams.get("q") ?? undefined,
    saleDateFrom: searchParams.get("saleDateFrom") ?? undefined,
    saleDateTo: searchParams.get("saleDateTo") ?? undefined,
    brandId: searchParams.get("brandId") ?? undefined,
    modelId: searchParams.get("modelId") ?? undefined,
    commercialId: searchParams.get("commercialId") ?? undefined,
  });

  return NextResponse.json(rows);
}
