import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { notificationTemplateSchema } from "@/lib/validations/notifications";
import type { NotificationChannel, NotificationEventType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermissionFresh("notifications.edit");
  if ("response" in gate) return gate.response;
  const rows = await prisma.notificationTemplate.findMany({ orderBy: [{ eventType: "asc" }, { channel: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("notifications.edit");
  if ("response" in gate) return gate.response;
  const parsed = notificationTemplateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.notificationTemplate.create({
    data: {
      key: parsed.data.key,
      name: parsed.data.name,
      channel: parsed.data.channel as NotificationChannel,
      eventType: parsed.data.eventType as NotificationEventType,
      subject: parsed.data.subject,
      body: parsed.data.body,
      variables: parsed.data.variables ?? [],
      isActive: parsed.data.isActive ?? true,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
