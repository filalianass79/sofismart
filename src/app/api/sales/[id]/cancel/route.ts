import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { cancelSale } from "@/lib/services/sale-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("ventes.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = await req.json();
  if (!body.reason?.trim()) {
    return NextResponse.json({ error: "Motif requis" }, { status: 400 });
  }
  try {
    await cancelSale(id, body.reason);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
