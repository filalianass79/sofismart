import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { getCashboxJournal } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const filters = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    minAmount: searchParams.get("minAmount") ? Number(searchParams.get("minAmount")) : undefined,
    maxAmount: searchParams.get("maxAmount") ? Number(searchParams.get("maxAmount")) : undefined,
  };

  try {
    const journal = await getCashboxJournal(gate.actor, id, filters);
    return NextResponse.json(journal);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
