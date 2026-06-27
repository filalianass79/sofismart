import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { getTransfer } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const transfer = await getTransfer(gate.actor, id);
  if (!transfer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(transfer);
}
