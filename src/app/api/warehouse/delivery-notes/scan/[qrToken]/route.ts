import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { depotFilter } from "@/lib/warehouse/depot-scope";

export async function GET(_req: Request, { params }: { params: Promise<{ qrToken: string }> }) {
  const gate = await warehouseSessionScope("warehouse.qr.scan");
  if ("response" in gate) return gate.response;

  const { qrToken } = await params;
  const note = await prisma.deliveryNote.findFirst({
    where: { qrToken, ...depotFilter(gate.scope) },
    include: {
      sale: { select: { reference: true, deliveryStatus: true } },
      client: { select: { name: true, phone: true } },
      vehicle: { include: { brand: true, carModel: true } },
      exitVoucher: { select: { reference: true, secureToken: true } },
    },
  });
  if (!note) return NextResponse.json({ error: "Bon introuvable" }, { status: 404 });
  return NextResponse.json(note);
}
