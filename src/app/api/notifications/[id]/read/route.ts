import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { markNotificationRead } from "@/lib/notifications/notification.service";

export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const updated = await markNotificationRead(id, gate.session.user.id);
  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}
