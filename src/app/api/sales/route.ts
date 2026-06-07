import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh, requireAuth } from "@/lib/api-auth";
import { saleWizardSchema } from "@/lib/validations/sale";
import { createSaleFromWizard } from "@/lib/services/sale-service";
import { userCanValidateSales } from "@/lib/rbac/can-validate-sale";
import { canViewFinancialsFromGate } from "@/lib/api-financial-auth";
import { stripSaleFinancials } from "@/lib/financial-privacy";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const clientId = searchParams.get("clientId");
  const commercialId = searchParams.get("commercialId");
  const paymentStatus = searchParams.get("paymentStatus");
  const saleType = searchParams.get("saleType");
  const status = searchParams.get("status");

  const rows = await prisma.sale.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(commercialId ? { commercialId } : {}),
      ...(paymentStatus ? { paymentStatus: paymentStatus as never } : {}),
      ...(saleType ? { saleType: saleType as never } : {}),
      ...(status ? { status: status as never } : { status: { not: "CANCELLED" } }),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: "insensitive" } },
              { client: { name: { contains: q, mode: "insensitive" } } },
              {
                vehicle: {
                  OR: [
                    { brand: { label: { contains: q, mode: "insensitive" } } },
                    { carModel: { label: { contains: q, mode: "insensitive" } } },
                    { internalRef: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { saleDate: "desc" },
    take: 500,
    include: {
      client: { select: { id: true, name: true } },
      vehicle: {
        select: {
          id: true,
          internalRef: true,
          brand: { select: { label: true } },
          carModel: { select: { label: true } },
        },
      },
      commercial: { select: { name: true } },
      payments: true,
    },
  });

  const canViewFinancials = "permissions" in gate ? canViewFinancialsFromGate(gate) : false;

  const list = rows.map((s) => {
    const paid = s.payments.reduce((a, p) => a + Number(p.amount), 0);
    const due = Number(s.finalPrice) || Number(s.price) - Number(s.discount);
    const row = {
      ...s,
      amountPaid: paid,
      amountDue: Math.max(0, due - paid),
    };
    return canViewFinancials ? row : stripSaleFinancials(row);
  });

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  const perm = await requirePermissionFresh("ventes.create");
  if ("response" in perm) return perm.response;

  const body = await req.json();
  const parsed = saleWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const permissions = gate.session.user.permissions ?? [];
    const roleCode = gate.session.user.roleCode ?? gate.session.user.role;
    const canValidate = userCanValidateSales(permissions, roleCode);
    const sale = await createSaleFromWizard(parsed.data, gate.session.user.id, {
      canValidateSale: canValidate,
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Une vente existe déjà pour ce véhicule." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
