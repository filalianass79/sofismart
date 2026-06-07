import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { recordProformaPrint } from "@/lib/services/proforma-service";
import { serializeProforma } from "@/lib/proforma-serialize";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.export");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const row = await recordProformaPrint(id, gate.session.user.id);
    return NextResponse.json(serializeProforma(row));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
