import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { paymentWizardSchema } from "@/lib/validations/payment";
import { createPaymentFromWizard } from "@/lib/services/payment-service";
import type { PaymentCategory, PaymentValidationStatus } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("paiements.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const method = searchParams.get("method");
  const overdue = searchParams.get("overdue") === "1";

  const now = new Date();
  const rows = await prisma.payment.findMany({
    where: {
      ...(category ? { category: category as PaymentCategory } : {}),
      ...(status ? { validationStatus: status as PaymentValidationStatus } : {}),
      ...(method ? { method: method as never } : {}),
      ...(q
        ? {
            OR: [
              { paymentReference: { contains: q, mode: "insensitive" } },
              { client: { name: { contains: q, mode: "insensitive" } } },
              { supplier: { name: { contains: q, mode: "insensitive" } } },
              { sale: { reference: { contains: q, mode: "insensitive" } } },
              { purchase: { reference: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(overdue
        ? {
            dueDate: { lt: now },
            validationStatus: { in: ["PENDING"] },
          }
        : {}),
    },
    orderBy: { paidAt: "desc" },
    take: 500,
    include: {
      client: { select: { name: true } },
      supplier: { select: { name: true } },
      sale: { select: { reference: true } },
      purchase: { select: { reference: true } },
      cashbox: { select: { id: true, name: true, reference: true } },
      cashMovements: {
        where: { status: "VALIDATED", type: { in: ["CREDIT", "DEBIT"] } },
        take: 1,
        select: { id: true, reference: true },
      },
    },
  });

  const list = rows.map((p) => ({
    ...p,
    overdue:
      p.dueDate &&
      p.dueDate < now &&
      (p.validationStatus === "PENDING" || p.validationStatus === "VALIDATED"),
  }));

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("paiements.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = paymentWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const payment = await createPaymentFromWizard(parsed.data, gate.session.user.id);
    return NextResponse.json(payment, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
