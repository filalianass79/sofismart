import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { cancelProforma } from "@/lib/services/proforma-service";
import { serializeProforma } from "@/lib/proforma-serialize";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.delete");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  try {
    const row = await cancelProforma(id, gate.session.user.id, body.reason);
    return NextResponse.json(serializeProforma(row));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
