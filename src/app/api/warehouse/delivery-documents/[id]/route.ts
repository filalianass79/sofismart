import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { depotFilter } from "@/lib/warehouse/depot-scope";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await warehouseSessionScope("warehouse.delivery_note.upload_signed");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const doc = await prisma.deliveryDocument.findUnique({
    where: { id },
    include: { deliveryNote: true },
  });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const filter = depotFilter(gate.scope);
  if (filter.depotId && doc.deliveryNote.depotId !== filter.depotId) {
    if (typeof filter.depotId === "object" && "in" in filter.depotId) {
      if (!filter.depotId.in.includes(doc.deliveryNote.depotId)) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }
  }

  await prisma.deliveryDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
