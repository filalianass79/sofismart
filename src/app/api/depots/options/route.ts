import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDepotPickerAccess } from "@/lib/api-auth";

/** Liste légère des dépôts actifs pour les sélecteurs (achats, véhicules, ventes). */
export async function GET() {
  const gate = await requireDepotPickerAccess();
  if ("response" in gate) return gate.response;

  const depots = await prisma.depot.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(depots);
}
