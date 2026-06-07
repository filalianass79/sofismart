import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { auth } from "@/auth";
import { interactionSchema } from "@/lib/validations/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const rows = await prisma.clientInteraction.findMany({
    where: { clientId: id },
    orderBy: { date: "desc" },
    include: { employee: { select: { name: true, email: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const session = await auth();
  const body = await req.json();
  const parsed = interactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const row = await prisma.clientInteraction.create({
    data: {
      clientId: id,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      summary: parsed.data.summary,
      nextAction: parsed.data.nextAction ?? null,
      nextFollowUpDate: parsed.data.nextFollowUpDate ? new Date(parsed.data.nextFollowUpDate) : null,
      employeeId: session?.user?.id ?? null,
    },
    include: { employee: { select: { name: true, email: true } } },
  });
  return NextResponse.json(row, { status: 201 });
}
