import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { retryEmailMessage } from "@/lib/notifications/email/email-log.service";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("emails.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const result = await retryEmailMessage(id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 400 });
  }
}
