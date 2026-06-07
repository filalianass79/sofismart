import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const sales = await prisma.sale.findMany({
    where: { clientId: id },
    include: {
      payments: { orderBy: { paidAt: "desc" } },
      vehicle: {
        select: {
          internalRef: true,
          brand: { select: { label: true } },
          carModel: { select: { label: true } },
        },
      },
    },
  });

  const payments = sales.flatMap((s) =>
    s.payments
      .filter((p) => p.direction === "FROM_CLIENT")
      .map((p) => ({
        ...p,
        saleId: s.id,
        vehicle: s.vehicle,
        saleNet: Number(s.price) - Number(s.discount),
      }))
  );

  const direct = await prisma.payment.findMany({
    where: { clientId: id, saleId: null },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json([...payments, ...direct]);
}
