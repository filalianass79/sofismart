import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { emailTemplateSchema } from "@/lib/validations/email";
import type { NotificationEventType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermissionFresh("emails.view");
  if ("response" in gate) return gate.response;
  const rows = await prisma.emailTemplate.findMany({ orderBy: { eventType: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("emails.edit");
  if ("response" in gate) return gate.response;
  const parsed = emailTemplateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.emailTemplate.create({
    data: {
      ...parsed.data,
      eventType: parsed.data.eventType as NotificationEventType,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
