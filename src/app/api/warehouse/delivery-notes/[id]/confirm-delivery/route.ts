import { NextResponse } from "next/server";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { confirmDeliverySchema } from "@/lib/validations/warehouse";
import { confirmDeliveryNote } from "@/lib/services/delivery-note-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await warehouseSessionScope("warehouse.delivery_note.confirm");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = confirmDeliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  try {
    const note = await confirmDeliveryNote(id, gate.session.user.id, parsed.data);
    return NextResponse.json(note);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
