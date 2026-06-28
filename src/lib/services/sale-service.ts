import { prisma } from "@/lib/prisma";
import { computeSaleAmounts, salePaymentStatusFromAmounts } from "@/lib/finance";
import { nextSaleReference } from "@/lib/references";
import { syncClientBalances, mapWizardToClientData } from "@/lib/services/client-service";
import { createExitVoucherForSale, isVehicleSaleable } from "@/lib/services/exit-voucher-service";
import { generateSaleInvoiceForSale } from "@/lib/services/sale-invoice-service";
import { createAuditLog } from "@/lib/audit";
import {
  notifyCommercialSaleValidated,
  notifyValidatorsOfSaleRequest,
} from "@/lib/services/sale-validation-notifications";
import type { PaymentMethod, SaleRecordStatus, SaleType } from "@/generated/prisma/enums";
import type { SaleWizardValues, NewClientValues } from "@/lib/validations/sale";
import { resolveCreditOrganizationId } from "@/lib/validations/credit-organization";
import type { Prisma } from "@/generated/prisma/client";

async function resolveClientId(
  payload: SaleWizardValues,
  tx: Prisma.TransactionClient,
  createOnValidate: boolean
): Promise<string | null> {
  if (payload.clientMode === "EXISTING" && payload.clientId) {
    return payload.clientId;
  }
  if (payload.clientMode === "NEW" && payload.newClient) {
    if (!createOnValidate) return null;
    const nc = payload.newClient;
    if (nc.type === "INDIVIDUAL" && nc.cin) {
      const dup = await tx.client.findUnique({ where: { cin: nc.cin } });
      if (dup) throw new Error("CIN déjà utilisé");
    }
    if (nc.type === "COMPANY" && nc.ice) {
      const dup = await tx.client.findUnique({ where: { ice: nc.ice } });
      if (dup) throw new Error("ICE déjà utilisé");
    }
    const body: Record<string, unknown> =
      nc.type === "INDIVIDUAL"
        ? { ...nc, firstName: nc.firstName, lastName: nc.lastName }
        : { ...nc, companyName: nc.companyName };
    const data = mapWizardToClientData(body);
    const { nextClientReference } = await import("@/lib/client-reference");
    const reference = await nextClientReference();
    const created = await tx.client.create({
      data: { ...data, reference, relationshipStatus: "ACTIVE" },
    });
    return created.id;
  }
  return null;
}

const saleReturnInclude = {
  client: true,
  creditOrganization: true,
  vehicle: { include: { brand: true, carModel: true, depot: true } },
  exitVoucher: true,
  commercial: true,
} as const;

async function assertCreditOrganizationForSale(payload: SaleWizardValues) {
  const id = resolveCreditOrganizationId(payload);
  if (!id) return null;
  const org = await prisma.creditOrganization.findFirst({ where: { id, isActive: true } });
  if (!org) throw new Error("Organisme de crédit invalide ou inactif");
  return id;
}

async function returnSaleById(saleId: string) {
  return prisma.sale.findUnique({ where: { id: saleId }, include: saleReturnInclude });
}

function resolveSubmitStatus(
  requested: SaleWizardValues["status"],
  canValidateSale: boolean
): SaleRecordStatus {
  if (requested === "DRAFT") return "DRAFT";
  if (canValidateSale) return "VALIDATED";
  return "PENDING_VALIDATION";
}

function vehicleAllowedForSaleValidation(status: string): boolean {
  return ["IN_STOCK", "RESERVED", "PREPARATION", "EXIT_PENDING"].includes(status);
}

async function afterSaleValidated(saleId: string, clientId: string, userId?: string, reference?: string) {
  await syncClientBalances(clientId);
  await createExitVoucherForSale(saleId, userId);
  await generateSaleInvoiceForSale(saleId, userId);
  await createAuditLog({
    actorUserId: userId,
    action: "SALE_VALIDATED",
    module: "ventes",
    targetType: "Sale",
    targetId: saleId,
    newValues: reference ? { reference } : undefined,
  });
  await notifyCommercialSaleValidated(saleId);
}

async function updateDraftSaleFromWizard(
  saleId: string,
  payload: SaleWizardValues,
  userId?: string
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: payload.vehicleId },
    include: { depot: true },
  });
  if (!vehicle) throw new Error("Véhicule introuvable");

  const amounts = computeSaleAmounts({
    price: payload.price,
    discount: payload.discount,
    taxAmount: payload.taxAmount,
    taxRatePercent: payload.taxRatePercent,
    costPrice: Number(vehicle.costPrice),
  });
  const marginRate =
    amounts.finalPrice > 0
      ? Math.round((amounts.margin / amounts.finalPrice) * 10000) / 10000
      : 0;
  const totalPaid = payload.payments
    .filter((p) => (p.validationStatus ?? "VALIDATED") === "VALIDATED")
    .reduce((a, p) => a + Number(p.amount), 0);
  const paymentStatus = salePaymentStatusFromAmounts(amounts.finalPrice, totalPaid);

  await prisma.$transaction(async (tx) => {
    const clientId = await resolveClientId(payload, tx, false);
    const creditOrganizationId = await assertCreditOrganizationForSale(payload);
    await tx.sale.update({
      where: { id: saleId },
      data: {
        clientId,
        creditOrganizationId,
        depotId: vehicle.depotId,
        commercialId: payload.commercialId ?? userId ?? null,
        saleDate: new Date(payload.saleDate),
        price: amounts.price,
        discount: amounts.discount,
        taxAmount: amounts.taxAmount,
        finalPrice: amounts.finalPrice,
        costPrice: Number(vehicle.costPrice),
        margin: amounts.margin,
        marginRate,
        advanceReceived: totalPaid,
        saleType: payload.saleType as SaleType,
        paymentMethod: payload.paymentMethod as PaymentMethod | undefined,
        paymentStatus,
        warranty: payload.warranty,
        warrantyDurationMonths: payload.warrantyDurationMonths ?? null,
        specialConditions: payload.specialConditions ?? null,
        notes: payload.notes ?? null,
        draftClient: payload.clientMode === "NEW" ? (payload.newClient as object) : undefined,
      },
    });
  });

  return returnSaleById(saleId);
}

async function completeDraftSaleFromWizard(
  saleId: string,
  payload: SaleWizardValues,
  userId?: string,
  canValidateSale = false
) {
  const existing = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { vehicle: { include: { depot: true } } },
  });
  if (!existing) throw new Error("Vente introuvable");
  if (existing.status !== "DRAFT") throw new Error("Seul un brouillon peut être validé ainsi");

  const vehicle = existing.vehicle;
  if (!isVehicleSaleable(vehicle.status)) {
    throw new Error("Ce véhicule n'est pas disponible à la vente");
  }

  const amounts = computeSaleAmounts({
    price: payload.price,
    discount: payload.discount,
    taxAmount: payload.taxAmount,
    taxRatePercent: payload.taxRatePercent,
    costPrice: Number(vehicle.costPrice),
  });
  const marginRate =
    amounts.finalPrice > 0
      ? Math.round((amounts.margin / amounts.finalPrice) * 10000) / 10000
      : 0;
  const totalPaid = payload.payments
    .filter((p) => (p.validationStatus ?? "VALIDATED") === "VALIDATED")
    .reduce((a, p) => a + Number(p.amount), 0);
  const paymentStatus = salePaymentStatusFromAmounts(amounts.finalPrice, totalPaid);
  const targetStatus = resolveSubmitStatus(payload.status, canValidateSale);
  const isValidated = targetStatus === "VALIDATED";

  const sale = await prisma.$transaction(async (tx) => {
    const clientId = await resolveClientId(payload, tx, true);
    if (!clientId) throw new Error("Client requis pour soumettre la vente");
    const creditOrganizationId = await assertCreditOrganizationForSale(payload);

    await tx.payment.deleteMany({ where: { saleId } });

    const s = await tx.sale.update({
      where: { id: saleId },
      data: {
        clientId,
        creditOrganizationId,
        depotId: vehicle.depotId,
        commercialId: payload.commercialId ?? userId ?? null,
        saleDate: new Date(payload.saleDate),
        price: amounts.price,
        discount: amounts.discount,
        taxAmount: amounts.taxAmount,
        finalPrice: amounts.finalPrice,
        costPrice: Number(vehicle.costPrice),
        margin: amounts.margin,
        marginRate,
        advanceReceived: totalPaid,
        saleType: payload.saleType as SaleType,
        paymentMethod: payload.paymentMethod as PaymentMethod | undefined,
        paymentStatus,
        status: targetStatus,
        deliveryStatus: isValidated ? "EXIT_PENDING" : "NOT_STARTED",
        warranty: payload.warranty,
        warrantyDurationMonths: payload.warrantyDurationMonths ?? null,
        specialConditions: payload.specialConditions ?? null,
        notes: payload.notes ?? null,
        draftClient: undefined,
        validatedById: isValidated ? userId ?? null : null,
        validatedAt: isValidated ? new Date() : null,
      },
    });

    if (payload.payments.length) {
      await tx.payment.createMany({
        data: payload.payments.map((p) => ({
          amount: Number(p.amount),
          method: p.method as PaymentMethod,
          direction: "FROM_CLIENT" as const,
          saleId,
          clientId,
          paidAt: new Date(p.paidAt),
          reference: p.reference ?? p.transferReference ?? null,
          bank: p.bank ?? null,
          checkNumber: p.checkNumber ?? null,
          dueDate: p.dueDate ? new Date(p.dueDate) : null,
          notes: p.notes ?? null,
          validationStatus: (p.validationStatus ?? "VALIDATED") as "VALIDATED",
          category: "SALE" as const,
        })),
      });
    }

    if (payload.pendingDocuments?.length) {
      await tx.document.createMany({
        data: payload.pendingDocuments.map((d) => ({
          category: d.category as never,
          originalName: d.originalName,
          path: d.path,
          mimeType: d.mimeType ?? null,
          size: d.size ?? null,
          saleId,
          clientId,
          vehicleId: payload.vehicleId,
          uploadedById: userId ?? null,
        })),
      });
    }

    if (isValidated) {
      await tx.vehicle.update({
        where: { id: payload.vehicleId },
        data: { status: "EXIT_PENDING" },
      });
      const movement = await tx.stockMovement.findFirst({
        where: { saleId, movementType: "SALE_EXIT_PENDING" },
      });
      if (!movement) {
        await tx.stockMovement.create({
          data: {
            vehicleId: payload.vehicleId,
            fromDepotId: vehicle.depotId,
            movementType: "SALE_EXIT_PENDING",
            status: "PENDING",
            saleId,
            reason: "Sortie vente en attente",
            userId: userId ?? null,
          },
        });
      }
    } else {
      await tx.vehicle.update({
        where: { id: payload.vehicleId },
        data: { status: "RESERVED" },
      });
    }

    return s;
  });

  if (sale.clientId && isValidated) {
    await afterSaleValidated(sale.id, sale.clientId, userId, sale.reference);
  } else if (targetStatus === "PENDING_VALIDATION") {
    await syncClientBalances(sale.clientId!);
    await notifyValidatorsOfSaleRequest(saleId);
    await createAuditLog({
      actorUserId: userId,
      action: "SALE_VALIDATION_REQUESTED",
      module: "ventes",
      targetType: "Sale",
      targetId: saleId,
      newValues: { reference: sale.reference },
    });
  }

  return returnSaleById(saleId);
}

export async function createSaleFromWizard(
  payload: SaleWizardValues,
  userId?: string,
  options?: { canValidateSale?: boolean }
) {
  const canValidateSale = options?.canValidateSale ?? false;
  const existingSale = await prisma.sale.findUnique({ where: { vehicleId: payload.vehicleId } });
  if (existingSale) {
    const isDraft = payload.status === "DRAFT";
    if (isDraft) {
      if (existingSale.status === "VALIDATED") {
        throw new Error("Une vente validée existe déjà pour ce véhicule.");
      }
      if (existingSale.status === "CANCELLED") {
        throw new Error("Ce véhicule est lié à une vente annulée. Contactez un administrateur.");
      }
      return updateDraftSaleFromWizard(existingSale.id, payload, userId);
    }
    if (existingSale.status === "DRAFT") {
      return completeDraftSaleFromWizard(existingSale.id, payload, userId, canValidateSale);
    }
    if (existingSale.status === "PENDING_VALIDATION") {
      throw new Error("Une demande de validation est déjà en cours pour ce véhicule.");
    }
    if (existingSale.status === "VALIDATED") {
      throw new Error("Une vente validée existe déjà pour ce véhicule.");
    }
    throw new Error("Ce véhicule est lié à une vente annulée. Contactez un administrateur.");
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: payload.vehicleId },
    include: { depot: true },
  });
  if (!vehicle) throw new Error("Véhicule introuvable");
  if (!isVehicleSaleable(vehicle.status)) {
    throw new Error("Ce véhicule n'est pas disponible à la vente");
  }

  const amounts = computeSaleAmounts({
    price: payload.price,
    discount: payload.discount,
    taxAmount: payload.taxAmount,
    taxRatePercent: payload.taxRatePercent,
    costPrice: Number(vehicle.costPrice),
  });

  const marginRate =
    amounts.finalPrice > 0
      ? Math.round((amounts.margin / amounts.finalPrice) * 10000) / 10000
      : 0;

  const totalPaid = payload.payments
    .filter((p) => (p.validationStatus ?? "VALIDATED") === "VALIDATED")
    .reduce((a, p) => a + Number(p.amount), 0);
  const paymentStatus = salePaymentStatusFromAmounts(amounts.finalPrice, totalPaid);
  const reference = await nextSaleReference(prisma);
  const isDraft = payload.status === "DRAFT";
  const status = resolveSubmitStatus(payload.status, canValidateSale);
  const isValidated = status === "VALIDATED";
  const isPending = status === "PENDING_VALIDATION";
  const needsClient = !isDraft;

  const sale = await prisma.$transaction(async (tx) => {
    const clientId = await resolveClientId(payload, tx, needsClient);
    if (needsClient && !clientId) throw new Error("Client requis pour soumettre la vente");
    const creditOrganizationId = needsClient ? await assertCreditOrganizationForSale(payload) : null;

    const s = await tx.sale.create({
      data: {
        reference,
        clientId,
        creditOrganizationId,
        vehicleId: payload.vehicleId,
        depotId: vehicle.depotId,
        commercialId: payload.commercialId ?? userId ?? null,
        saleDate: new Date(payload.saleDate),
        price: amounts.price,
        discount: amounts.discount,
        taxAmount: amounts.taxAmount,
        finalPrice: amounts.finalPrice,
        costPrice: Number(vehicle.costPrice),
        margin: amounts.margin,
        marginRate,
        advanceReceived: totalPaid,
        saleType: payload.saleType as SaleType,
        paymentMethod: payload.paymentMethod as PaymentMethod | undefined,
        paymentStatus,
        status,
        deliveryStatus: isValidated ? "EXIT_PENDING" : "NOT_STARTED",
        warranty: payload.warranty,
        warrantyDurationMonths: payload.warrantyDurationMonths ?? null,
        specialConditions: payload.specialConditions ?? null,
        notes: payload.notes ?? null,
        draftClient: isDraft && payload.clientMode === "NEW" ? (payload.newClient as object) : undefined,
        validatedById: isValidated ? userId ?? null : null,
        validatedAt: isValidated ? new Date() : null,
      },
    });

    if (needsClient && payload.payments.length) {
      await tx.payment.createMany({
        data: payload.payments.map((p) => ({
          amount: Number(p.amount),
          method: p.method as PaymentMethod,
          direction: "FROM_CLIENT" as const,
          saleId: s.id,
          clientId: clientId!,
          paidAt: new Date(p.paidAt),
          reference: p.reference ?? p.transferReference ?? null,
          bank: p.bank ?? null,
          checkNumber: p.checkNumber ?? null,
          dueDate: p.dueDate ? new Date(p.dueDate) : null,
          notes: p.notes ?? null,
          validationStatus: (p.validationStatus ?? "VALIDATED") as "VALIDATED",
          category: "SALE" as const,
        })),
      });
    }

    if (needsClient && payload.pendingDocuments?.length) {
      await tx.document.createMany({
        data: payload.pendingDocuments.map((d) => ({
          category: d.category as never,
          originalName: d.originalName,
          path: d.path,
          mimeType: d.mimeType ?? null,
          size: d.size ?? null,
          saleId: s.id,
          clientId: clientId!,
          vehicleId: payload.vehicleId,
          uploadedById: userId ?? null,
        })),
      });
    }

    if (!isDraft) {
      if (isValidated) {
        await tx.vehicle.update({
          where: { id: payload.vehicleId },
          data: { status: "EXIT_PENDING" },
        });
        await tx.stockMovement.create({
          data: {
            vehicleId: payload.vehicleId,
            fromDepotId: vehicle.depotId,
            movementType: "SALE_EXIT_PENDING",
            status: "PENDING",
            saleId: s.id,
            reason: "Sortie vente en attente",
            userId: userId ?? null,
          },
        });
      } else if (isPending) {
        await tx.vehicle.update({
          where: { id: payload.vehicleId },
          data: { status: "RESERVED" },
        });
      }
    }

    return s;
  });

  if (sale.status === "VALIDATED" && sale.clientId) {
    await afterSaleValidated(sale.id, sale.clientId, userId, sale.reference);
  } else if (sale.status === "PENDING_VALIDATION") {
    await syncClientBalances(sale.clientId!);
    await notifyValidatorsOfSaleRequest(sale.id);
    await createAuditLog({
      actorUserId: userId,
      action: "SALE_VALIDATION_REQUESTED",
      module: "ventes",
      targetType: "Sale",
      targetId: sale.id,
      newValues: { reference: sale.reference },
    });
  }

  return returnSaleById(sale.id);
}

export async function validateSale(saleId: string, userId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { vehicle: true, payments: true },
  });
  if (!sale) throw new Error("Vente introuvable");
  if (sale.status === "VALIDATED") throw new Error("Vente déjà validée");
  if (sale.status === "CANCELLED") throw new Error("Vente annulée");
  if (sale.status !== "DRAFT" && sale.status !== "PENDING_VALIDATION") {
    throw new Error("Cette vente ne peut pas être validée");
  }
  if (!vehicleAllowedForSaleValidation(sale.vehicle.status)) {
    throw new Error("Véhicule non disponible");
  }

  const draftClient = sale.draftClient as NewClientValues | null;
  const payload: SaleWizardValues = {
    clientMode: sale.clientId ? "EXISTING" : "NEW",
    clientId: sale.clientId ?? undefined,
    newClient: draftClient ?? undefined,
    vehicleId: sale.vehicleId,
    financedByCreditOrg: !!sale.creditOrganizationId,
    creditOrganizationId: sale.creditOrganizationId ?? undefined,
    commercialId: sale.commercialId ?? userId,
    saleDate: sale.saleDate.toISOString().slice(0, 10),
    price: Number(sale.price),
    discount: Number(sale.discount),
    taxAmount: Number(sale.taxAmount),
    saleType: sale.saleType,
    payments: [],
    taxRatePercent: 20,
    pendingDocuments: [],
    status: "VALIDATED",
    warranty: sale.warranty,
    warrantyDurationMonths: sale.warrantyDurationMonths,
    specialConditions: sale.specialConditions ?? undefined,
    notes: sale.notes ?? undefined,
  };

  await prisma.$transaction(async (tx) => {
    let clientId = sale.clientId;
    if (!clientId) {
      clientId = await resolveClientId(payload, tx, true);
    }
    if (!clientId) throw new Error("Impossible de créer le client");

    await tx.sale.update({
      where: { id: saleId },
      data: {
        clientId,
        status: "VALIDATED",
        deliveryStatus: "EXIT_PENDING",
        validatedById: userId,
        validatedAt: new Date(),
        draftClient: undefined,
      },
    });

    await tx.vehicle.update({
      where: { id: sale.vehicleId },
      data: { status: "EXIT_PENDING" },
    });

    await tx.stockMovement.create({
      data: {
        vehicleId: sale.vehicleId,
        fromDepotId: sale.vehicle.depotId,
        movementType: "SALE_EXIT_PENDING",
        status: "PENDING",
        saleId,
        reason: "Sortie vente en attente",
        userId,
      },
    });
  });

  const updated = await prisma.sale.findUnique({ where: { id: saleId } });
  if (updated?.clientId) {
    await afterSaleValidated(saleId, updated.clientId, userId, updated.reference);
  }

  return prisma.sale.findUnique({
    where: { id: saleId },
    include: { client: true, vehicle: { include: { brand: true, carModel: true } }, exitVoucher: true },
  });
}

export async function cancelSale(saleId: string, reason: string, userId?: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { vehicle: true, exitVoucher: true },
  });
  if (!sale) throw new Error("Vente introuvable");
  if (sale.status === "CANCELLED") throw new Error("Vente déjà annulée");
  if (sale.exitVoucher?.status === "DELIVERED") {
    throw new Error("Impossible d'annuler : véhicule déjà livré");
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: saleId },
      data: { status: "CANCELLED", cancelReason: reason, deliveryStatus: "CANCELLED" },
    });
    if (sale.exitVoucher) {
      await tx.exitVoucher.update({
        where: { id: sale.exitVoucher.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: userId ?? null, cancellationReason: reason },
      });
    }
    if (sale.vehicle && ["EXIT_PENDING", "SOLD", "RESERVED"].includes(sale.vehicle.status)) {
      await tx.vehicle.update({
        where: { id: sale.vehicleId },
        data: { status: "IN_STOCK", finalSalePrice: null },
      });
    }
    await tx.stockMovement.updateMany({
      where: { saleId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  });

  if (sale.clientId) await syncClientBalances(sale.clientId);
  await createAuditLog({
    actorUserId: userId,
    action: "SALE_CANCELLED",
    module: "ventes",
    targetType: "Sale",
    targetId: saleId,
    newValues: { reason },
  });
}
