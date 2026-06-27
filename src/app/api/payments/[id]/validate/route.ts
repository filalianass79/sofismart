import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { validatePayment } from "@/lib/services/payment-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("paiements.validate");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  try {
    const payment = await validatePayment(id, gate.session.user.id);
    return NextResponse.json(payment);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
