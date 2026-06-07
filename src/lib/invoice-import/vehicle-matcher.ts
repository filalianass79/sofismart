import { prisma } from "@/lib/prisma";
import type { StructuredInvoiceData, VehicleMatchResult } from "./types";

export async function matchVehicles(
  structured: StructuredInvoiceData,
): Promise<VehicleMatchResult[]> {
  const vin = String(structured.vehicle.vin.value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s/g, "");
  const plate = String(structured.vehicle.plate.value ?? "")
    .trim()
    .replace(/\s/g, "")
    .toUpperCase();

  if (!vin && !plate) return [];

  const or: { vin?: string; plate?: string }[] = [];
  if (vin.length >= 11) or.push({ vin });
  if (plate.length >= 4) or.push({ plate });

  const vehicles = await prisma.vehicle.findMany({
    where: { OR: or },
    include: { brand: true, carModel: true },
    take: 10,
  });

  return vehicles.map((v) => ({
    id: v.id,
    internalRef: v.internalRef,
    vin: v.vin,
    plate: v.plate,
    brandLabel: v.brand.label,
    modelLabel: v.carModel.label,
    score: vin && v.vin === vin ? 0.98 : plate && v.plate?.replace(/\s/g, "") === plate ? 0.9 : 0.7,
  }));
}
