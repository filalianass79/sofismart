import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac/has-permission";
import { canViewFinancialsFromGate } from "@/lib/api-financial-auth";
import { vehicleWizardSchema } from "@/lib/validations/vehicle";
import { upsertVehicleFromWizard } from "@/lib/vehicle-service";
import { stripVehicleDetailForApi } from "@/lib/financial-privacy";
import { listVehiclesForUi, serializeVehiclesForList } from "@/lib/vehicles-list-query";
import type { VehicleStatus } from "@/generated/prisma/enums";

function canListVehicles(permissions: Set<string> | string[]) {
  return (
    hasPermission(permissions, "vehicles:*") ||
    hasPermission(permissions, "vehicules.view") ||
    hasPermission(permissions, "achats.view")
  );
}

export async function GET(req: Request) {
  const gateView = await requirePermissionFresh("vehicules.view");
  let gate = gateView;
  if ("response" in gateView) {
    const gateAchats = await requirePermissionFresh("achats.view");
    if ("response" in gateAchats) return gateView.response;
    if (!("permissions" in gateAchats) || !canListVehicles(gateAchats.permissions)) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    gate = gateAchats;
  }

  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId") ?? undefined;
  const status = (searchParams.get("status") as VehicleStatus) || undefined;
  const depotId = searchParams.get("depotId") ?? undefined;
  const archived = (searchParams.get("archived") as "0" | "1" | "all") || "0";
  const q = searchParams.get("q")?.trim();

  const vehicles = await listVehiclesForUi({
    brandId,
    status: status || undefined,
    depotId,
    archived,
    q,
  });

  const canViewFinancials = canViewFinancialsFromGate(gate as Parameters<typeof canViewFinancialsFromGate>[0]);

  return NextResponse.json(serializeVehiclesForList(vehicles, canViewFinancials));
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("vehicules.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = vehicleWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const canViewFinancials = canViewFinancialsFromGate(gate as Parameters<typeof canViewFinancialsFromGate>[0]);

  try {
    const vehicle = await upsertVehicleFromWizard(parsed.data, undefined, {
      lockFinancialFields: !canViewFinancials,
    });
    return NextResponse.json(stripVehicleDetailForApi(vehicle, canViewFinancials), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
