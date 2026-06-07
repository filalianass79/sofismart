import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { supplierWizardSchema } from "@/lib/validations/supplier";
import { buildSupplierName } from "@/lib/services/supplier-service";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePermission("suppliers:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { purchaseDate: "desc" },
        take: 50,
        include: { vehicle: true, fees: true, payments: true },
      },
      payments: { orderBy: { paidAt: "desc" }, take: 100 },
      documents: { orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { purchases: true } },
    },
  });

  if (!supplier) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const totalPurchases = supplier.purchases.reduce(
    (a, p) => a + Number(p.totalPurchasePrice || p.basePrice),
    0
  );
  const totalPaid = supplier.purchases.reduce(
    (a, p) => a + p.payments.reduce((s, pay) => s + Number(pay.amount), 0),
    0
  );

  return NextResponse.json({
    ...supplier,
    stats: {
      purchaseCount: supplier._count.purchases,
      totalPurchases,
      totalPaid,
      balance: Math.max(0, totalPurchases - totalPaid),
    },
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePermission("suppliers:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = supplierWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      type: d.type,
      name: buildSupplierName(d),
      firstName: d.firstName || null,
      lastName: d.lastName || null,
      companyName: d.companyName || null,
      tradeName: d.tradeName || null,
      cin: d.cin || null,
      ice: d.ice || null,
      rc: d.rc || null,
      taxId: d.taxId || null,
      patent: d.patent || null,
      phone: d.phone || null,
      secondaryPhone: d.secondaryPhone || null,
      email: d.email || null,
      address: d.address || null,
      city: d.city || null,
      country: d.country || "Maroc",
      contactName: d.contactName || null,
      contactRole: d.contactRole || null,
      contactPhone: d.contactPhone || null,
      preferredPaymentMethod: d.preferredPaymentMethod ?? null,
      paymentDelay: d.paymentDelay ?? null,
      bankName: d.bankName || null,
      iban: d.iban || null,
      notes: d.notes || null,
    },
  });
  return NextResponse.json(supplier);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requirePermission("suppliers:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;

  const count = await prisma.purchase.count({ where: { supplierId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer : achats liés existants" },
      { status: 409 }
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
