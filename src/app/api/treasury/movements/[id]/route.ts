import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { cancelMovementSchema } from "@/lib/validations/treasury";
import { cancelMovement, validateMovement } from "@/lib/services/cashbox-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.view");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const movement = await prisma.cashMovement.findUnique({
    where: { id },
    include: {
      cashbox: true,
      createdBy: { select: { name: true, email: true } },
      validatedBy: { select: { name: true } },
      documents: true,
      transfer: true,
    },
  });
  if (!movement) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(movement);
}

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.validate");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;

  try {
    if (action === "cancel") {
      const parsed = cancelMovementSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const reversal = await cancelMovement(gate.actor, id, parsed.data.cancellationReason);
      return NextResponse.json(reversal);
    }

    const movement = await validateMovement(gate.actor, id);
    return NextResponse.json(movement);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
