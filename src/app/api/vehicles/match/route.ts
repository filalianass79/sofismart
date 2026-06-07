import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { matchVehicles } from "@/lib/invoice-import/vehicle-matcher";
import { extractStructuredFromText } from "@/lib/invoice-import/invoice-extraction-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("vehicules.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin") ?? "";
  const plate = searchParams.get("plate") ?? "";

  const structured = extractStructuredFromText("");
  structured.vehicle.vin.value = vin;
  structured.vehicle.plate.value = plate;

  const matches = await matchVehicles(structured);
  return NextResponse.json(matches);
}
