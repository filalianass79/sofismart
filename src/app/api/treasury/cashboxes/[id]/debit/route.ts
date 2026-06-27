import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { debitCashboxSchema } from "@/lib/validations/treasury";
import { debitCashbox } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.create");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const parsed = debitCashboxSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const movement = await debitCashbox(gate.actor, id, parsed.data);
    return NextResponse.json(movement, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
