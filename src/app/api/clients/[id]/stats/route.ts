import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { getClientStats } from "@/lib/services/client-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const stats = await getClientStats(id);
  return NextResponse.json(stats);
}
