import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { clientWizardSchema } from "@/lib/validations/client";
import { getClientStats, updateClient } from "@/lib/services/client-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      assignedCommercial: { select: { id: true, name: true, email: true } },
      clientDocuments: { orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { name: true, email: true } } } },
      interactions: {
        orderBy: { date: "desc" },
        include: { employee: { select: { name: true, email: true } } },
      },
      reminders: { orderBy: { dueDate: "asc" }, include: { assignedTo: { select: { name: true } } } },
      sales: {
        orderBy: { saleDate: "desc" },
        include: {
          vehicle: true,
          payments: true,
          documents: true,
        },
      },
    },
  });
  if (!client) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const stats = await getClientStats(id);
  return NextResponse.json({ ...client, stats });
}

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = await req.json();
  const parsed = clientWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.cin) {
    const dup = await prisma.client.findFirst({ where: { cin: parsed.data.cin, id: { not: id } } });
    if (dup) return NextResponse.json({ error: "CIN déjà utilisé" }, { status: 409 });
  }
  if (parsed.data.ice) {
    const dup = await prisma.client.findFirst({ where: { ice: parsed.data.ice, id: { not: id } } });
    if (dup) return NextResponse.json({ error: "ICE déjà utilisé" }, { status: 409 });
  }

  const client = await updateClient(id, parsed.data);
  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.delete");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const salesCount = await prisma.sale.count({ where: { clientId: id } });
  if (salesCount > 0) {
    return NextResponse.json({ error: "Impossible de supprimer un client lié à des ventes" }, { status: 400 });
  }

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
