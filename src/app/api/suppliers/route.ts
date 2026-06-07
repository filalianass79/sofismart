import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { supplierWizardSchema } from "@/lib/validations/supplier";
import { createSupplier } from "@/lib/services/supplier-service";
import type { SupplierType } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("fournisseurs.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const city = searchParams.get("city");
  const archived = searchParams.get("archived") === "1";

  const suppliers = await prisma.supplier.findMany({
    where: {
      isArchived: archived,
      ...(type ? { type: type as SupplierType } : {}),
      ...(status ? { status: status as never } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              { cin: { contains: q, mode: "insensitive" } },
              { ice: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      purchases: { select: { totalPurchasePrice: true, basePrice: true, payments: { select: { amount: true } } } },
    },
  });

  const rows = suppliers.map((s) => {
    const totalPurchases = s.purchases.reduce(
      (a, p) => a + Number(p.totalPurchasePrice || p.basePrice),
      0
    );
    const totalPaid = s.purchases.reduce(
      (a, p) => a + p.payments.reduce((s2, pay) => s2 + Number(pay.amount), 0),
      0
    );
    return {
      id: s.id,
      reference: s.reference,
      type: s.type,
      name: s.name,
      cin: s.cin,
      ice: s.ice,
      phone: s.phone,
      city: s.city,
      balance: s.balance,
      status: s.status,
      isArchived: s.isArchived,
      stats: { totalPurchases, totalPaid, balance: Math.max(0, totalPurchases - totalPaid) },
    };
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("fournisseurs.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = supplierWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const supplier = await createSupplier(parsed.data);
    return NextResponse.json(supplier, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
