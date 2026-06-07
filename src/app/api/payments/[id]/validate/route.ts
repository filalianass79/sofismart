import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { syncLinkedRecords } from "@/lib/services/payment-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("paiements.validate");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const payment = await prisma.payment.update({
    where: { id },
    data: { validationStatus: "VALIDATED" },
  });
  await syncLinkedRecords(id);
  return NextResponse.json(payment);
}
