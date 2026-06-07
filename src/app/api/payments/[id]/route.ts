import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { purchasePaymentStatusFromAmounts } from "@/lib/finance";
import type { PaymentMethod } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

async function syncPurchasePayments(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { payments: true },
  });
  if (!purchase) return;
  const paid = purchase.payments.reduce((a, p) => a + Number(p.amount), 0);
  const due = Number(purchase.totalPurchasePrice);
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      advancePaid: paid,
      paymentStatus: purchasePaymentStatusFromAmounts(due, paid),
    },
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePermission("payments:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const body = await req.json();

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amount: body.amount != null ? Number(body.amount) : undefined,
      method: body.method as PaymentMethod | undefined,
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
      reference: body.reference ?? undefined,
      bank: body.bank ?? undefined,
      checkNumber: body.checkNumber ?? undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      notes: body.notes ?? undefined,
    },
  });

  if (payment.purchaseId) await syncPurchasePayments(payment.purchaseId);
  return NextResponse.json(payment);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requirePermission("payments:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const payment = await prisma.payment.delete({ where: { id } });
  if (payment.purchaseId) await syncPurchasePayments(payment.purchaseId);
  return NextResponse.json({ ok: true });
}
