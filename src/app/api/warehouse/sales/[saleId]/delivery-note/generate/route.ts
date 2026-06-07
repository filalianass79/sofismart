import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { generateDeliveryNoteForSale } from "@/lib/services/delivery-note-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const gate = await warehouseSessionScope("warehouse.delivery_note.generate");
  if ("response" in gate) return gate.response;

  const { saleId } = await params;
  try {
    const note = await generateDeliveryNoteForSale(saleId, gate.session.user.id);
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
