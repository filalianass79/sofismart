import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { cashboxSchema } from "@/lib/validations/treasury";
import { getCashbox, updateCashbox } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const box = await getCashbox(gate.actor, id);
  if (!box) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(box);
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.edit");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const parsed = cashboxSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const box = await updateCashbox(gate.actor, id, parsed.data);
    return NextResponse.json(box);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
