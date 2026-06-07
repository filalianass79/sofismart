import { prisma } from "@/lib/prisma";
import type { FuelType, TransmissionType, VehicleOrigin, VehicleStatus } from "@/generated/prisma/enums";
import type { VehicleWizardValues } from "@/lib/validations/vehicle";

function mapVehicleData(payload: VehicleWizardValues) {
  const { vehicle: v, pricing: p } = payload;
  const purchasePrice = Number(p.purchasePrice) || 0;
  const extraFeesTotal = Number(p.extraFeesTotal) || 0;
  const costPrice = purchasePrice + extraFeesTotal;

  return {
    internalRef: v.internalRef || `V-${Date.now()}`,
    brandId: v.brandId,
    modelId: v.modelId,
    version: v.version || null,
    year: Number(v.year),
    firstRegistrationDate: v.firstRegistrationDate ? new Date(v.firstRegistrationDate) : null,
    mileage: Number(v.mileage ?? 0),
    fuel: (v.fuel || null) as FuelType | null,
    transmission: (v.transmission || null) as TransmissionType | null,
    color: v.color || null,
    interiorColor: v.interiorColor || null,
    vin: v.vin || null,
    plate: v.plate || null,
    matriculeW: v.matriculeW || null,
    origin: v.origin as VehicleOrigin,
    originCountry: v.originCountry || null,
    vehicleCondition: v.vehicleCondition || null,
    conditionNotes: v.conditionNotes || null,
    purchasePrice,
    extraFeesTotal,
    costPrice,
    targetSalePrice: v.targetSalePrice != null ? Number(v.targetSalePrice) : null,
    status: v.status as VehicleStatus,
    depotId: v.depotId,
    isArchived: false,
  };
}

export async function upsertVehicleFromWizard(
  payload: VehicleWizardValues,
  vehicleId?: string,
  options?: { lockFinancialFields?: boolean },
) {
  let data = mapVehicleData(payload);

  if (options?.lockFinancialFields && vehicleId) {
    const existing = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { purchasePrice: true, extraFeesTotal: true, costPrice: true },
    });
    if (existing) {
      data = {
        ...data,
        purchasePrice: Number(existing.purchasePrice),
        extraFeesTotal: Number(existing.extraFeesTotal),
        costPrice: Number(existing.costPrice),
      };
    }
  }

  if (vehicleId) {
    const vehicle = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data,
      });
      if (payload.documents?.length) {
        await tx.document.updateMany({
          where: { id: { in: payload.documents.map((d) => d.id) } },
          data: { vehicleId },
        });
      }
      return tx.vehicle.findUniqueOrThrow({
        where: { id: vehicleId },
        include: {
          brand: true,
          carModel: true,
          depot: true,
          documents: true,
        },
      });
    });
    return vehicle;
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.vehicle.create({
      data,
      include: { brand: true, carModel: true, depot: true },
    });
    if (payload.documents?.length) {
      await tx.document.updateMany({
        where: { id: { in: payload.documents.map((d) => d.id) } },
        data: { vehicleId: created.id },
      });
    }
    return tx.vehicle.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        brand: true,
        carModel: true,
        depot: true,
        documents: true,
      },
    });
  });
}
