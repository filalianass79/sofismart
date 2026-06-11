import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requirePurchaseEditAccess } from "@/lib/api-purchase-auth";
import { getInvoiceImportPayload, runAiOnly } from "@/lib/invoice-import/invoice-import-service";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseEditAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const session = await auth();
  try {
    await runAiOnly(id, session?.user?.id ?? null);
    const payload = await getInvoiceImportPayload(id);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA";
    const status = /désactivée|clé API|Limite/i.test(msg) ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
