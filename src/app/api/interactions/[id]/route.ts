import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { interactionSchema } from "@/lib/validations/client";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = await req.json();
  const parsed = interactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const row = await prisma.clientInteraction.update({
    where: { id },
    data: {
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      summary: parsed.data.summary,
      nextAction: parsed.data.nextAction ?? null,
      nextFollowUpDate: parsed.data.nextFollowUpDate ? new Date(parsed.data.nextFollowUpDate) : null,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  await prisma.clientInteraction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
