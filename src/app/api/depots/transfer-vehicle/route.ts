import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("depots.edit");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const { vehicleId, toDepotId, reason } = body;
  if (!vehicleId || !toDepotId) {
    return NextResponse.json({ error: "vehicleId et toDepotId requis" }, { status: 400 });
  }

  const session = await auth();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  if (vehicle.depotId === toDepotId) {
    return NextResponse.json({ error: "Même dépôt" }, { status: 400 });
  }

  const target = await prisma.depot.findUnique({
    where: { id: toDepotId },
    include: { _count: { select: { vehicles: true } } },
  });
  if (!target) return NextResponse.json({ error: "Dépôt cible introuvable" }, { status: 404 });
  if (target._count.vehicles >= target.maxCapacity) {
    return NextResponse.json({ error: "Capacité du dépôt atteinte" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        vehicleId,
        fromDepotId: vehicle.depotId,
        toDepotId,
        movementType: "TRANSFER",
        reason: reason ?? "Transfert inter-dépôts",
        userId: session?.user?.id ?? null,
      },
    });
    return tx.vehicle.update({
      where: { id: vehicleId },
      data: { depotId: toDepotId },
      include: { depot: true },
    });
  });

  return NextResponse.json(updated);
}
