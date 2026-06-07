import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { assertPreviewType, logDocEvent } from "@/lib/documents/document-api-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { type, id } = await params;
  try {
    assertPreviewType(type);
    await logDocEvent(type, id, "PRINTED", gate.session.user.id, {
      status: "PRINTED",
      printedAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
