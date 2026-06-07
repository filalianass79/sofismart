import { NextResponse } from "next/server";
import { requirePurchaseEditAccess } from "@/lib/api-purchase-auth";
import { saveDraftFromImport } from "@/lib/invoice-import/invoice-import-service";
import type { PurchaseWizardValues } from "@/lib/validations/purchase";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requirePurchaseEditAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json()) as { wizard: PurchaseWizardValues };
  try {
    const result = await saveDraftFromImport(id, body.wizard);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
