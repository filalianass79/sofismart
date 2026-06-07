import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("vehicules.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: { isArchived: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (existing.isArchived) {
    return NextResponse.json({ error: "Ce véhicule est déjà archivé." }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { isArchived: true },
    include: { brand: true, carModel: true, depot: true },
  });
  return NextResponse.json(vehicle);
}
