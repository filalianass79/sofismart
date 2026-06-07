import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { canViewFinancialsFromGate } from "@/lib/api-financial-auth";
import type { Prisma } from "@/generated/prisma/client";

const SALEABLE = ["IN_STOCK", "RESERVED", "PREPARATION"] as const;

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("vehicules.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const brandId = searchParams.get("brandId");
  const modelId = searchParams.get("modelId");
  const depotId = searchParams.get("depotId");
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  const origin = searchParams.get("origin");
  const fuel = searchParams.get("fuel");
  const transmission = searchParams.get("transmission");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const availableOnly = searchParams.get("availableOnly") !== "false";

  const where: Prisma.VehicleWhereInput = {
    ...(availableOnly ? { status: { in: [...SALEABLE] }, sale: { is: null } } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
    ...(depotId ? { depotId } : {}),
    ...(origin ? { origin: origin as never } : {}),
    ...(fuel ? { fuel: fuel as never } : {}),
    ...(transmission ? { transmission: transmission as never } : {}),
    ...(yearMin || yearMax
      ? {
          year: {
            ...(yearMin ? { gte: parseInt(yearMin, 10) } : {}),
            ...(yearMax ? { lte: parseInt(yearMax, 10) } : {}),
          },
        }
      : {}),
    ...(priceMin || priceMax
      ? {
          targetSalePrice: {
            ...(priceMin ? { gte: priceMin } : {}),
            ...(priceMax ? { lte: priceMax } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { internalRef: { contains: q, mode: "insensitive" } },
            { plate: { contains: q, mode: "insensitive" } },
            { vin: { contains: q, mode: "insensitive" } },
            { version: { contains: q, mode: "insensitive" } },
            { brand: { label: { contains: q, mode: "insensitive" } } },
            { carModel: { label: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const rows = await prisma.vehicle.findMany({
    where,
    take: 60,
    orderBy: [{ brand: { label: "asc" } }, { carModel: { label: "asc" } }],
    include: {
      brand: { select: { id: true, label: true } },
      carModel: { select: { id: true, label: true } },
      depot: { select: { id: true, name: true, city: true } },
      photos: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const canViewFinancials = "permissions" in gate ? canViewFinancialsFromGate(gate) : false;

  return NextResponse.json(
    rows.map((v) => ({
      id: v.id,
      internalRef: v.internalRef,
      brand: v.brand,
      carModel: v.carModel,
      version: v.version,
      year: v.year,
      mileage: v.mileage,
      fuel: v.fuel,
      transmission: v.transmission,
      color: v.color,
      plate: v.plate,
      vin: v.vin,
      status: v.status,
      origin: v.origin,
      costPrice: canViewFinancials ? Number(v.costPrice) : 0,
      targetSalePrice: v.targetSalePrice ? Number(v.targetSalePrice) : null,
      depot: v.depot,
      mainPhoto: v.photos[0]?.path ?? null,
    })),
  );
}
