import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { markAllNotificationsRead } from "@/lib/notifications/notification.service";

export const runtime = "nodejs";

export async function PATCH() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  await markAllNotificationsRead(gate.session.user.id);
  return NextResponse.json({ ok: true });
}
