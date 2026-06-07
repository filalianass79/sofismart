import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { listUserNotifications } from "@/lib/notifications/notification.service";
import type { AppNotificationStatus, NotificationEventType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const status = searchParams.get("status") as AppNotificationStatus | null;
  const moduleFilter = searchParams.get("module") ?? undefined;
  const eventType = searchParams.get("eventType") as NotificationEventType | null;
  const search = searchParams.get("q") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 30), 100);
  const skip = Number(searchParams.get("skip") ?? 0);

  const rows = await listUserNotifications(gate.session.user.id, {
    status: unreadOnly ? "UNREAD" : status ?? undefined,
    module: moduleFilter,
    eventType: eventType ?? undefined,
    search,
    take,
    skip,
  });

  return NextResponse.json(rows);
}
