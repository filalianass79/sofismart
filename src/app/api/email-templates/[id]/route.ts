import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { emailTemplateSchema } from "@/lib/validations/email";
import type { NotificationEventType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("emails.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const row = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("emails.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = emailTemplateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...parsed.data,
      eventType: parsed.data.eventType as NotificationEventType,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("emails.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  await prisma.emailTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
