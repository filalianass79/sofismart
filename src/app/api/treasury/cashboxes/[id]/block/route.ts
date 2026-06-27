import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { blockCashbox } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.edit");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  try {
    const box = await blockCashbox(gate.actor, id);
    return NextResponse.json(box);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
