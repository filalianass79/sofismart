import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { creditOrganizationSchema } from "@/lib/validations/credit-organization";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("parametres.edit");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = creditOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = {
    ...parsed.data,
    code: parsed.data.code?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    email: parsed.data.email?.trim() || null,
    address: parsed.data.address?.trim() || null,
    city: parsed.data.city?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  };

  try {
    const row = await prisma.creditOrganization.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Organisme introuvable ou doublon" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("parametres.delete");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const usage = await prisma.creditOrganization.findUnique({
    where: { id },
    include: { _count: { select: { sales: true, proformas: true } } },
  });
  if (!usage) {
    return NextResponse.json({ error: "Organisme introuvable" }, { status: 404 });
  }
  if (usage._count.sales + usage._count.proformas > 0) {
    return NextResponse.json(
      { error: "Impossible : des ventes ou proformas utilisent cet organisme" },
      { status: 409 },
    );
  }

  await prisma.creditOrganization.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
