import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { syncLinkedRecords } from "@/lib/services/payment-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("paiements.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const { reason } = await req.json().catch(() => ({ reason: null }));

  const payment = await prisma.payment.update({
    where: { id },
    data: { validationStatus: "CANCELLED", cancelReason: reason ?? null },
  });
  await syncLinkedRecords(id);
  return NextResponse.json(payment);
}
