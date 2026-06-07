import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePurchaseCreateAccess, requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { stripPurchasesFinancials } from "@/lib/purchase-privacy";
import { purchaseWizardSchema } from "@/lib/validations/purchase";
import { upsertPurchase } from "@/lib/purchase-service";
import type { Prisma } from "@/generated/prisma/client";
import type { PurchasePaymentStatus, PurchaseStatus, PurchaseType } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId") ?? undefined;
  const status = (searchParams.get("status") as PurchaseStatus) ?? undefined;
  const paymentStatus = (searchParams.get("paymentStatus") as PurchasePaymentStatus) ?? undefined;
  const purchaseType = (searchParams.get("purchaseType") as PurchaseType) ?? undefined;
  const depotId = searchParams.get("depotId") ?? undefined;
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.PurchaseWhereInput = {
    supplierId,
    status,
    paymentStatus,
    purchaseType,
    ...(from || to
      ? {
          purchaseDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(depotId ? { vehicle: { depotId } } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { vehicle: { vin: { contains: q, mode: "insensitive" } } },
            { vehicle: { plate: { contains: q, mode: "insensitive" } } },
            { vehicle: { brand: { label: { contains: q, mode: "insensitive" } } } },
            { vehicle: { carModel: { label: { contains: q, mode: "insensitive" } } } },
            { vehicle: { matriculeW: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const rows = await prisma.purchase.findMany({
    where,
    orderBy: { purchaseDate: "desc" },
    take: 500,
    include: {
      supplier: true,
      vehicle: { include: { depot: true, brand: true, carModel: true } },
      fees: true,
      payments: true,
      _count: { select: { documents: true } },
    },
  });

  const payload = gate.canViewFinancials ? rows : stripPurchasesFinancials(rows);
  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const gate = await requirePurchaseCreateAccess();
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const status = (body.status as PurchaseStatus) ?? "DRAFT";
  const parsed = purchaseWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const purchase = await upsertPurchase({ ...parsed.data, status });
    const payload = gate.canViewFinancials ? purchase : stripPurchasesFinancials([purchase])[0];
    return NextResponse.json(payload, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
