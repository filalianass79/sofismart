import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { notificationTemplateSchema } from "@/lib/validations/notifications";
import type { NotificationChannel, NotificationEventType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("notifications.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = notificationTemplateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.notificationTemplate.update({
    where: { id },
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject,
      body: parsed.data.body,
      variables: parsed.data.variables ?? [],
      isActive: parsed.data.isActive ?? true,
      channel: parsed.data.channel as NotificationChannel,
      eventType: parsed.data.eventType as NotificationEventType,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("notifications.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  await prisma.notificationTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
