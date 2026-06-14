import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { z } from "zod";

export const runtime = "nodejs";

const settingSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  recipientRoles: z.array(z.string()).optional(),
  sendToCommercial: z.boolean().optional(),
  sendToWarehouse: z.boolean().optional(),
  sendToManager: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("whatsapp.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = settingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.notificationSetting.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const row = await prisma.notificationSetting.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(row);
}
