import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { depotFilter } from "@/lib/warehouse/depot-scope";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await warehouseSessionScope("warehouse.delivery_note.download");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const note = await prisma.deliveryNote.findFirst({
    where: { id, ...depotFilter(gate.scope) },
    include: {
      sale: true,
      client: true,
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      exitVoucher: true,
      documents: true,
      generatedBy: { select: { name: true } },
      deliveredBy: { select: { name: true } },
    },
  });
  if (!note) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(note);
}
