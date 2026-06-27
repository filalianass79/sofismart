import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { rejectTransferSchema } from "@/lib/validations/treasury";
import { rejectTransfer } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.validate");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const parsed = rejectTransferSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const transfer = await rejectTransfer(gate.actor, id, parsed.data.rejectionReason);
    return NextResponse.json(transfer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
