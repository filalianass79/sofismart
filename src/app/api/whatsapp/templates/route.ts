import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { listWhatsAppTemplates, upsertWhatsAppTemplate } from "@/lib/whatsapp/whatsapp-template.service";
import type { NotificationEventType } from "@/generated/prisma/enums";
import { z } from "zod";

export const runtime = "nodejs";

const templateSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  eventType: z.string(),
  language: z.string().optional(),
  metaTemplateName: z.string().optional().nullable(),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const gate = await requirePermissionFresh("whatsapp.view");
  if ("response" in gate) return gate.response;
  const rows = await listWhatsAppTemplates();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("whatsapp.edit");
  if ("response" in gate) return gate.response;
  const parsed = templateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const row = await upsertWhatsAppTemplate({
    ...parsed.data,
    eventType: parsed.data.eventType as NotificationEventType,
  });
  return NextResponse.json(row);
}
