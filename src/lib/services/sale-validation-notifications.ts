import { prisma } from "@/lib/prisma";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { dispatchNotificationEventAsync } from "@/lib/notifications/notification-dispatcher";

/** Utilisateurs pouvant valider une vente (gérants + administrateurs). */
export async function findSaleValidatorUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      OR: [
        { role: "ADMIN" },
        { appRole: { code: { in: ["ADMIN", "GERANT"] } } },
      ],
    },
    select: { id: true },
  });
  return [...new Set(users.map((u) => u.id))];
}

export async function notifyValidatorsOfSaleRequest(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      commercial: { select: { name: true } },
      client: { select: { name: true } },
      vehicle: { include: { brand: true, carModel: true } },
    },
  });
  if (!sale) return;

  const vehicleLabel = formatVehicleTitle(sale.vehicle);
  const commercialName = sale.commercial?.name ?? "Un commercial";
  const validatorIds = await findSaleValidatorUserIds();

  dispatchNotificationEventAsync({
    eventType: "SALE_VALIDATION_REQUEST",
    userIds: validatorIds,
    module: "ventes",
    actionUrl: `/dashboard/sales/${saleId}`,
    category: "ACTION_REQUIRED",
    payload: {
      title: "Demande de validation de vente",
      message: `${commercialName} demande la validation de la vente ${sale.reference} — ${sale.client?.name ?? "client"} — ${vehicleLabel}.`,
      saleId,
      saleReference: sale.reference,
      commercialName,
      clientName: sale.client?.name ?? "",
      vehicleLabel,
      vehicleBrand: sale.vehicle.brand.label,
      vehicleModel: sale.vehicle.carModel.label,
      registrationNumber: sale.vehicle.plate ?? "",
      actionUrl: `/dashboard/sales/${saleId}`,
    },
  });
}

export async function notifyCommercialSaleValidated(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      client: { select: { name: true } },
      vehicle: { include: { brand: true, carModel: true, depot: true } },
    },
  });
  if (!sale?.commercialId) return;

  const vehicleLabel = formatVehicleTitle(sale.vehicle);
  const depotName = sale.vehicle.depot?.name ?? "—";

  dispatchNotificationEventAsync({
    eventType: "SALE_VALIDATED",
    userIds: [sale.commercialId],
    module: "ventes",
    actionUrl: `/dashboard/sales/${saleId}`,
    category: "SUCCESS",
    payload: {
      title: "Vente validée",
      message: `La vente ${sale.reference} a été validée — ${sale.client?.name ?? "client"} — ${vehicleLabel}. Facture et bon de sortie disponibles.`,
      saleReference: sale.reference,
      clientName: sale.client?.name ?? "",
      vehicleLabel,
      vehicleBrand: sale.vehicle.brand.label,
      vehicleModel: sale.vehicle.carModel.label,
      registrationNumber: sale.vehicle.plate ?? "",
      depotName,
      actionUrl: `/dashboard/sales/${saleId}`,
    },
  });
}
