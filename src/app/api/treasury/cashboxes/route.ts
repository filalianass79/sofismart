import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { cashboxSchema } from "@/lib/validations/treasury";
import { createCashbox, listCashboxes } from "@/lib/services/cashbox-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const rows = await listCashboxes(gate.actor, q);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requireTreasuryActor("caisse.create");
  if ("response" in gate) return gate.response;

  const parsed = cashboxSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const box = await createCashbox(gate.actor, parsed.data);
    return NextResponse.json(box, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
