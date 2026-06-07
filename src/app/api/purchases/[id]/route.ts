import { NextResponse } from "next/server";
import { requirePurchaseEditAccess, requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { stripPurchaseFinancials } from "@/lib/purchase-privacy";
import { purchaseWizardSchema } from "@/lib/validations/purchase";
import {
  deletePurchase,
  getPurchaseDetail,
  upsertPurchase,
} from "@/lib/purchase-service";
import type { PurchaseStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const purchase = await getPurchaseDetail(id);
  if (!purchase) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const payload = gate.canViewFinancials ? purchase : stripPurchaseFinancials(purchase);
  return NextResponse.json(payload);
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePurchaseEditAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
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
    const purchase = await upsertPurchase({ ...parsed.data, status }, id);
    const payload = gate.canViewFinancials ? purchase : stripPurchaseFinancials(purchase);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseEditAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const result = await deletePurchase(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
