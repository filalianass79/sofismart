import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { canViewFinancialsFromGate } from "@/lib/api-financial-auth";
import { stripSaleFinancials } from "@/lib/financial-privacy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      client: true,
      vehicle: { include: { depot: true } },
      commercial: { select: { id: true, name: true, email: true } },
      payments: { orderBy: { paidAt: "desc" } },
      documents: true,
    },
  });
  if (!sale) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const paid = sale.payments.reduce((a, p) => a + Number(p.amount), 0);
  const due = Number(sale.finalPrice) || Number(sale.price) - Number(sale.discount);

  const canViewFinancials = "permissions" in gate ? canViewFinancialsFromGate(gate) : false;

  const payload = {
    ...sale,
    amountPaid: paid,
    amountDue: Math.max(0, due - paid),
  };
  return NextResponse.json(canViewFinancials ? payload : stripSaleFinancials(payload));
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("ventes.delete");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  await prisma.sale.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
