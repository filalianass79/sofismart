import { NextResponse } from "next/server";
import { requirePurchaseViewAccess } from "@/lib/api-purchase-auth";
import { getInvoiceImportPayload } from "@/lib/invoice-import/invoice-import-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  try {
    const payload = await getInvoiceImportPayload(id);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
