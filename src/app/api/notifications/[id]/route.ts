import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { deleteNotification } from "@/lib/notifications/notification.service";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const ok = await deleteNotification(id, gate.session.user.id);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
