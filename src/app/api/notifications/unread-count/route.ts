import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUnreadCount } from "@/lib/notifications/notification.service";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const count = await getUnreadCount(gate.session.user.id);
  return NextResponse.json({ count });
}
