import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { loadProformaDocumentData } from "@/lib/documents/proforma-loader";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const data = await loadProformaDocumentData(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Proforma introuvable" }, { status: 404 });
  }
}
