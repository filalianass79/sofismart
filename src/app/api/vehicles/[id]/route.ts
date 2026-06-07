import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requirePermissionFresh } from "@/lib/api-auth";
import { canViewFinancialsFromGate } from "@/lib/api-financial-auth";
import { stripVehicleDetailForApi } from "@/lib/financial-privacy";
import { vehicleWizardSchema } from "@/lib/validations/vehicle";
import { upsertVehicleFromWizard } from "@/lib/vehicle-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePermission("vehicles:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      brand: true,
      carModel: true,
      depot: true,
      photos: true,
      documents: true,
      movements: { orderBy: { createdAt: "desc" }, take: 50, include: { fromDepot: true, toDepot: true } },
      purchase: { include: { supplier: true, fees: true, payments: true } },
      sale: { include: { client: true, payments: true } },
    },
  });
  if (!vehicle) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const canViewFinancials = canViewFinancialsFromGate({
    session: gate.session,
    permissions: gate.session.user.permissions,
  });
  return NextResponse.json(stripVehicleDetailForApi(vehicle, canViewFinancials));
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requirePermissionFresh("vehicules.edit");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: { isArchived: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (existing.isArchived) {
    return NextResponse.json({ error: "Véhicule archivé : modification impossible." }, { status: 400 });
  }

  const parsed = vehicleWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const canViewFinancials = "permissions" in gate ? canViewFinancialsFromGate(gate) : false;

  try {
    const vehicle = await upsertVehicleFromWizard(parsed.data, id, {
      lockFinancialFields: !canViewFinancials,
    });
    return NextResponse.json(stripVehicleDetailForApi(vehicle, canViewFinancials));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requirePermissionFresh("vehicules.delete");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      purchase: { select: { id: true } },
      sale: { select: { id: true } },
    },
  });
  if (!vehicle) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (vehicle.purchase || vehicle.sale) {
    return NextResponse.json(
      {
        error: vehicle.sale
          ? "Impossible de supprimer : une vente est liée à ce véhicule."
          : "Impossible de supprimer : un achat est lié à ce véhicule.",
      },
      { status: 409 },
    );
  }

  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
