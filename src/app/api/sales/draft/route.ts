import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { saleWizardSchema } from "@/lib/validations/sale";
import { createSaleFromWizard } from "@/lib/services/sale-service";
import { Prisma } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("ventes.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = saleWizardSchema.safeParse({ ...body, status: "DRAFT" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const sale = await createSaleFromWizard(parsed.data, gate.session.user.id);
    return NextResponse.json(sale, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Une vente existe déjà pour ce véhicule." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
