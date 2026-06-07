import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const gate = await requirePermissionFresh("magasin.view");
  if ("response" in gate) return gate.response;

  const { token } = await params;
  const voucher = await prisma.exitVoucher.findUnique({
    where: { secureToken: token },
    include: {
      sale: { include: { client: true, commercial: true } },
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      assignedWarehouseUser: { select: { id: true, name: true } },
    },
  });
  if (!voucher) return NextResponse.json({ error: "Bon introuvable" }, { status: 404 });

  return NextResponse.json({
    ...voucher,
    sale: {
      ...voucher.sale,
      finalPrice: Number(voucher.sale.finalPrice),
    },
  });
}
