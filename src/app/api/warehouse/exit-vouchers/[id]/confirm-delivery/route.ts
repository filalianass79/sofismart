import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { confirmDeliverySchema } from "@/lib/validations/sale";
import { confirmExitVoucherDelivery } from "@/lib/services/exit-voucher-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("magasin.validate");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = confirmDeliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await confirmExitVoucherDelivery(id, gate.session.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
