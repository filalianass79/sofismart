import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { getTreasuryDashboard } from "@/lib/services/treasury-dashboard-service";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const data = await getTreasuryDashboard(gate.actor);
  return NextResponse.json(data);
}
