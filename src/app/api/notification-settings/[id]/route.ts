import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { notificationSettingSchema } from "@/lib/validations/notifications";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("notifications.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = notificationSettingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.notificationSetting.update({
    where: { id },
    data: {
      internalEnabled: parsed.data.internalEnabled,
      whatsappEnabled: parsed.data.whatsappEnabled,
      recipientRoles: parsed.data.recipientRoles,
      recipientUserIds: parsed.data.recipientUserIds,
      sendToClient: parsed.data.sendToClient,
      sendToEmployee: parsed.data.sendToEmployee,
      isActive: parsed.data.isActive,
    },
  });
  return NextResponse.json(updated);
}
