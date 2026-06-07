import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { loadCommercialDocument } from "@/lib/documents/loaders";
import { assertPreviewType } from "@/lib/documents/document-api-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { type, id } = await params;
  try {
    const docType = assertPreviewType(type);
    const data = await loadCommercialDocument(docType, id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
