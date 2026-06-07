import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { findGeneratedDoc, assertPreviewType } from "@/lib/documents/document-api-helpers";
import { getDocumentHistory } from "@/lib/documents/document-history-service";

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { type, id } = await params;
  try {
    assertPreviewType(type);
    const doc = await findGeneratedDoc(type, id);
    if (!doc) return NextResponse.json([]);
    const history = await getDocumentHistory(doc.id);
    return NextResponse.json(history);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
