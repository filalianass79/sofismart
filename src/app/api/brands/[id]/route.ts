import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { brandSchema } from "@/lib/validations/brand";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePermission("users:*");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const row = await prisma.brand.update({ where: { id }, data: parsed.data });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Marque introuvable ou libellé déjà utilisé" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermission("users:*");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const count = await prisma.vehicle.count({ where: { brandId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "Impossible : des véhicules utilisent cette marque" }, { status: 409 });
  }

  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
