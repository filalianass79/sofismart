import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { emailNotificationSettingSchema } from "@/lib/validations/email";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("emails.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = emailNotificationSettingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.emailNotificationSetting.update({
    where: { id },
    data: {
      ...parsed.data,
      eventType: parsed.data.eventType as import("@/generated/prisma/enums").NotificationEventType,
    },
  });
  return NextResponse.json(updated);
}
