import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { depotFilter } from "@/lib/warehouse/depot-scope";
import { generateDeliveryNotePdf } from "@/lib/services/delivery-note-service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await warehouseSessionScope("warehouse.delivery_note.download");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  let note = await prisma.deliveryNote.findFirst({
    where: { id, ...depotFilter(gate.scope) },
    select: { pdfUrl: true, reference: true },
  });
  if (!note) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (!note.pdfUrl) {
    const pdfUrl = await generateDeliveryNotePdf(id);
    note = { ...note, pdfUrl };
    await prisma.deliveryNote.update({ where: { id }, data: { pdfUrl } });
  }

  const abs = path.join(process.cwd(), "public", note.pdfUrl!.replace(/^\//, ""));
  const buf = await readFile(abs);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${note.reference}.pdf"`,
    },
  });
}
