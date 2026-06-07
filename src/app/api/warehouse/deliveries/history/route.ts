import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { getDeliveryHistory } from "@/lib/services/warehouse-dashboard-service";

export async function GET(req: Request) {
  const gate = await warehouseSessionScope("warehouse.delivery_history.view");
  if ("response" in gate) return gate.response;

  const period = (new URL(req.url).searchParams.get("period") as "day" | "week" | "month") || "month";
  const data = await getDeliveryHistory(gate.scope, period);
  return NextResponse.json(data);
}
