import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { vehicleModelSchema } from "@/lib/validations/vehicle-model";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("parametres.edit");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = vehicleModelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const row = await prisma.vehicleModel.update({
      where: { id },
      data: parsed.data,
      include: { brand: { select: { id: true, label: true } } },
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Modèle introuvable ou doublon" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("parametres.delete");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const count = await prisma.vehicle.count({ where: { modelId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "Impossible : des véhicules utilisent ce modèle" }, { status: 409 });
  }

  await prisma.vehicleModel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
