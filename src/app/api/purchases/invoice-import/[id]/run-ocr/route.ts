import { NextResponse } from "next/server";
import { requirePurchaseEditAccess } from "@/lib/api-purchase-auth";
import { getInvoiceImportPayload, runOcrOnly } from "@/lib/invoice-import/invoice-import-service";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseEditAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  try {
    await runOcrOnly(id);
    const payload = await getInvoiceImportPayload(id);
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur OCR" }, { status: 400 });
  }
}
