import { NextResponse } from "next/server";
import { requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { getPurchaseSummary } from "@/lib/purchase-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const summary = await getPurchaseSummary(id);
  if (!summary) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (!gate.canViewFinancials) {
    return NextResponse.json({
      ...summary,
      totalPurchasePrice: 0,
      costPrice: 0,
      totalPaid: 0,
      balance: 0,
    });
  }
  return NextResponse.json(summary);
}
