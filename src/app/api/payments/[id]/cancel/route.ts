import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { cancelPayment } from "@/lib/services/payment-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("paiements.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const { reason } = await req.json().catch(() => ({ reason: null }));

  try {
    const payment = await cancelPayment(id, gate.session.user.id, reason);
    return NextResponse.json(payment);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
