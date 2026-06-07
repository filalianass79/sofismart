import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const gate = await requirePermission("depots:*");
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

  const updated = await prisma.$transaction(async (tx) => {
    const fromId = vehicle.depotId;
    await tx.stockMovement.create({
      data: {
        vehicleId,
        fromDepotId: fromId,
        toDepotId,
        reason: reason ?? null,
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
