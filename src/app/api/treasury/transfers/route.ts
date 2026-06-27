import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { transferCashboxSchema } from "@/lib/validations/treasury";
import { createTransfer, listTransfers } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const rows = await listTransfers(gate.actor, status);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requireTreasuryActor("caisse.create");
  if ("response" in gate) return gate.response;

  const parsed = transferCashboxSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const transfer = await createTransfer(gate.actor, parsed.data);
    return NextResponse.json(transfer, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
