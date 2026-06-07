import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { depotSchema } from "@/lib/validations/depot";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("depots.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const depot = await prisma.depot.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      vehicles: {
        where: { status: { not: "SOLD" } },
        orderBy: { internalRef: "asc" },
        take: 100,
      },
      movementsFrom: { orderBy: { movementDate: "desc" }, take: 20, include: { vehicle: true } },
      _count: { select: { vehicles: true } },
    },
  });
  if (!depot) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({
    ...depot,
    vehiclesCount: depot._count.vehicles,
    remainingCapacity: Math.max(0, depot.maxCapacity - depot._count.vehicles),
  });
}

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("depots.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const parsed = depotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const depot = await prisma.depot.update({
    where: { id },
    data: {
      name: d.name,
      address: d.address ?? null,
      city: d.city ?? null,
      phone: d.phone ?? null,
      managerId: d.managerId ?? null,
      maxCapacity: d.maxCapacity,
      depotType: d.depotType,
      status: d.status,
      notes: d.notes ?? null,
    },
  });
  return NextResponse.json(depot);
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("depots.delete");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const count = await prisma.vehicle.count({ where: { depotId: id, status: { not: "SOLD" } } });
  if (count > 0) {
    return NextResponse.json({ error: "Dépôt contenant des véhicules" }, { status: 400 });
  }

  await prisma.depot.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ ok: true });
}
