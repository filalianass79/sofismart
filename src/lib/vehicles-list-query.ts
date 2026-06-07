import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { VehicleStatus } from "@/generated/prisma/enums";

export type SerializedVehicleRow = {
  id: string;
  internalRef: string | null;
  brand: { id: string; label: string };
  carModel: { id: string; label: string };
  version?: string | null;
  plate: string | null;
  status: VehicleStatus;
  isArchived?: boolean;
  costPrice: number;
  depot: { id: string; name: string };
  purchase?: { id: string; reference?: string; status?: string } | null;
  sale?: { id: string } | null;
};

export const vehicleListInclude = {
  brand: true,
  carModel: true,
  depot: true,
  purchase: { select: { id: true, reference: true, status: true } },
  sale: { select: { id: true } },
} satisfies Prisma.VehicleInclude;

export type VehicleListFilters = {
  brandId?: string;
  status?: VehicleStatus;
  depotId?: string;
  archived?: "0" | "1" | "all";
  q?: string;
};

function archivedFilter(archived: VehicleListFilters["archived"]): Prisma.VehicleWhereInput {
  if (archived === "1") return { isArchived: true };
  if (archived === "all") return {};
  return { isArchived: false };
}

export function buildVehicleListWhere(filters: VehicleListFilters): Prisma.VehicleWhereInput {
  const { brandId, status, depotId, archived = "0", q } = filters;
  return {
    AND: [
      archivedFilter(archived),
      brandId ? { brandId } : {},
      status ? { status } : {},
      depotId ? { depotId } : {},
      q
        ? {
            OR: [
              { internalRef: { contains: q, mode: "insensitive" as const } },
              { plate: { contains: q, mode: "insensitive" as const } },
              { vin: { contains: q, mode: "insensitive" as const } },
              { matriculeW: { contains: q, mode: "insensitive" as const } },
              { brand: { label: { contains: q, mode: "insensitive" as const } } },
              { carModel: { label: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
    ],
  };
}

/** Filtre sans isArchived (schéma ou client Prisma pas à jour). */
export function buildVehicleListWhereLegacy(filters: VehicleListFilters): Prisma.VehicleWhereInput {
  const { brandId, status, depotId, q } = filters;
  return {
    AND: [
      brandId ? { brandId } : {},
      status ? { status } : {},
      depotId ? { depotId } : {},
      q
        ? {
            OR: [
              { internalRef: { contains: q, mode: "insensitive" as const } },
              { plate: { contains: q, mode: "insensitive" as const } },
              { vin: { contains: q, mode: "insensitive" as const } },
              { matriculeW: { contains: q, mode: "insensitive" as const } },
              { brand: { label: { contains: q, mode: "insensitive" as const } } },
              { carModel: { label: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
    ],
  };
}

function isArchivedFieldError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("isArchived") || msg.includes("Unknown argument");
}

export async function listVehiclesForUi(filters: VehicleListFilters = {}) {
  try {
    return await prisma.vehicle.findMany({
      where: buildVehicleListWhere(filters),
      orderBy: { updatedAt: "desc" },
      take: 500,
      include: vehicleListInclude,
    });
  } catch (err) {
    if (!isArchivedFieldError(err)) throw err;
    return prisma.vehicle.findMany({
      where: buildVehicleListWhereLegacy(filters),
      orderBy: { updatedAt: "desc" },
      take: 500,
      include: vehicleListInclude,
    });
  }
}

export function serializeVehiclesForList(
  vehicles: Awaited<ReturnType<typeof listVehiclesForUi>>,
  canViewFinancials = true,
): SerializedVehicleRow[] {
  return vehicles.map((v) => ({
    id: v.id,
    internalRef: v.internalRef,
    brand: { id: v.brand.id, label: v.brand.label },
    carModel: { id: v.carModel.id, label: v.carModel.label },
    version: v.version,
    plate: v.plate,
    status: v.status,
    isArchived: "isArchived" in v ? Boolean((v as { isArchived?: boolean }).isArchived) : false,
    costPrice: canViewFinancials ? Number(v.costPrice) : 0,
    depot: { id: v.depot.id, name: v.depot.name },
    purchase: v.purchase
      ? { id: v.purchase.id, reference: v.purchase.reference, status: v.purchase.status }
      : null,
    sale: v.sale ? { id: v.sale.id } : null,
  }));
}

/** Achats validés sans fiche véhicule — à réparer après migration ou bug historique. */
export async function repairPurchasesMissingVehicles() {
  const orphans = await prisma.purchase.findMany({
    where: { vehicleId: null },
    select: { id: true, reference: true },
  });
  return { orphanPurchaseCount: orphans.length, orphanReferences: orphans.map((p) => p.reference) };
}
