import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { retryWhatsAppMessage } from "@/lib/notifications/whatsapp.service";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("whatsapp.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const result = await retryWhatsAppMessage(id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
