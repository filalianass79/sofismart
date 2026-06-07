import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { proformaInvoiceSchema } from "@/lib/validations/proforma";
import { getProformaById, updateProforma } from "@/lib/services/proforma-service";
import { serializeProforma } from "@/lib/proforma-serialize";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const row = await getProformaById(id);
  if (!row) return NextResponse.json({ error: "Proforma introuvable" }, { status: 404 });
  return NextResponse.json(serializeProforma(row));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = proformaInvoiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const row = await updateProforma(id, parsed.data, gate.session.user.id);
    return NextResponse.json(serializeProforma(row));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
