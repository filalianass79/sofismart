import { prisma } from "@/lib/prisma";
import {
  computePurchaseTotals,
  purchasePaymentStatusFromAmounts,
  sumFees,
} from "@/lib/finance";
import { generatePurchaseReference, generateVehicleInternalRef } from "@/lib/purchase-reference";
import type {
  Currency,
  FuelType,
  PaymentMethod,
  PurchaseFeeType,
  PurchaseStatus,
  TransmissionType,
  VehicleCondition,
  VehicleOrigin,
  VehicleStatus,
} from "@/generated/prisma/enums";
import type { PurchaseWizardValues } from "@/lib/validations/purchase";

export type PurchasePayload = PurchaseWizardValues & {
  status: PurchaseStatus;
};

function mapFees(fees: PurchaseWizardValues["invoice"]["fees"]) {
  return fees.map((f) => ({
    type: f.type as PurchaseFeeType,
    amount: Number(f.amount),
    label: f.label || null,
    expenseDate: new Date(),
    notes: f.notes || null,
  }));
}

function mapPayments(
  payments: PurchaseWizardValues["payments"],
  purchaseId: string,
  supplierId: string
) {
  return payments.map((p) => ({
    amount: Number(p.amount),
    method: p.method as PaymentMethod,
    direction: "TO_SUPPLIER" as const,
    purchaseId,
    supplierId,
    paidAt: new Date(p.paidAt),
    reference: p.reference || null,
    bank: p.bank || null,
    checkNumber: p.checkNumber || null,
    dueDate: p.dueDate ? new Date(p.dueDate) : null,
    notes: p.notes || null,
  }));
}

export async function upsertPurchase(payload: PurchasePayload, existingId?: string) {
  const { invoice, vehicle, payments, supplierId, status } = payload;
  const feeRows = mapFees(invoice.fees);
  const totals = computePurchaseTotals({
    amountHT: invoice.amountHT,
    taxAmount: invoice.taxAmount,
    discount: 0,
    fees: feeRows,
  });
  const totalPaid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const paymentStatus = purchasePaymentStatusFromAmounts(totals.totalPurchasePrice, totalPaid);

  return prisma.$transaction(async (tx) => {
    const reference =
      existingId
        ? (
            await tx.purchase.findUnique({
              where: { id: existingId },
              select: { reference: true },
            })
          )?.reference ?? (await generatePurchaseReference(tx))
        : await generatePurchaseReference(tx);

    let vehicleId: string | null = null;
    let vehicleRecord: { id: string } | null = null;

    if (existingId) {
      const existing = await tx.purchase.findUnique({
        where: { id: existingId },
        select: { vehicleId: true },
      });
      vehicleId = existing?.vehicleId ?? null;
    }

    const internalRef =
      vehicle.internalRef?.trim() || (await generateVehicleInternalRef(tx));

    const vehicleData = {
      internalRef,
      brandId: vehicle.brandId,
      modelId: vehicle.modelId,
      version: vehicle.version || null,
      year: vehicle.year,
      firstRegistrationDate: vehicle.firstRegistrationDate
        ? new Date(vehicle.firstRegistrationDate)
        : null,
      mileage: vehicle.mileage ?? 0,
      fuel: vehicle.fuel ? (vehicle.fuel as FuelType) : null,
      transmission: vehicle.transmission ? (vehicle.transmission as TransmissionType) : null,
      color: vehicle.color || null,
      interiorColor: vehicle.interiorColor || null,
      fiscalPower: vehicle.fiscalPower ? Number(vehicle.fiscalPower) : null,
      engineSize: vehicle.engineSize || null,
      vin: vehicle.vin?.trim() || null,
      plate: vehicle.plate?.trim() || null,
      matriculeW: vehicle.matriculeW?.trim() || null,
      origin: vehicle.origin as VehicleOrigin,
      originCountry: vehicle.originCountry || null,
      vehicleCondition: (vehicle.vehicleCondition as VehicleCondition) || null,
      conditionNotes: vehicle.conditionNotes || null,
      purchasePrice: totals.totalPurchasePrice,
      extraFeesTotal: totals.totalExpenses,
      costPrice: totals.costPrice,
      targetSalePrice: vehicle.targetSalePrice ? Number(vehicle.targetSalePrice) : null,
      status: vehicle.status as VehicleStatus,
      depotId: vehicle.depotId,
      isArchived: false,
    };

    if (vehicleId) {
      vehicleRecord = await tx.vehicle.update({
        where: { id: vehicleId },
        data: vehicleData,
      });
    } else {
      vehicleRecord = await tx.vehicle.create({ data: vehicleData });
      vehicleId = vehicleRecord.id;
    }

    const purchaseData = {
      reference,
      supplierId,
      vehicleId,
      invoiceNumber: invoice.invoiceNumber || null,
      purchaseDate: new Date(invoice.purchaseDate),
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : null,
      purchaseType: invoice.purchaseType,
      currency: "MAD" as Currency,
      amountHT: totals.amountHT,
      taxAmount: totals.taxAmount,
      amountTTC: totals.amountTTC,
      discount: 0,
      totalPurchasePrice: totals.totalPurchasePrice,
      totalExpenses: totals.totalExpenses,
      costPrice: totals.costPrice,
      basePrice: totals.totalPurchasePrice,
      advancePaid: totalPaid,
      paymentStatus,
      status,
      notes: invoice.notes || null,
    };

    let purchase;
    if (existingId) {
      await tx.purchaseFee.deleteMany({ where: { purchaseId: existingId } });
      await tx.payment.deleteMany({
        where: { purchaseId: existingId, direction: "TO_SUPPLIER" },
      });
      purchase = await tx.purchase.update({
        where: { id: existingId },
        data: {
          ...purchaseData,
          fees: { create: feeRows },
        },
        include: {
          fees: true,
          supplier: true,
          vehicle: { include: { brand: true, carModel: true, depot: true } },
          payments: true,
          documents: true,
        },
      });
    } else {
      purchase = await tx.purchase.create({
        data: {
          ...purchaseData,
          fees: { create: feeRows },
        },
        include: {
          fees: true,
          supplier: true,
          vehicle: { include: { brand: true, carModel: true, depot: true } },
          payments: true,
          documents: true,
        },
      });
    }

    if (payments.length > 0) {
      await tx.payment.createMany({
        data: mapPayments(payments, purchase.id, supplierId),
      });
    }

    if (status === "VALIDATED" && vehicleId) {
      const existingMovement = await tx.stockMovement.findFirst({
        where: { purchaseId: purchase.id, movementType: "INITIAL" },
      });
      if (!existingMovement) {
        await tx.stockMovement.create({
          data: {
            vehicleId,
            purchaseId: purchase.id,
            movementType: "INITIAL",
            toDepotId: vehicle.depotId,
            reason: `Entrée stock — achat ${reference}`,
            movementDate: new Date(invoice.purchaseDate),
          },
        });
      }
    }

    if (payload.documents?.length) {
      await tx.document.updateMany({
        where: { id: { in: payload.documents.map((d) => d.id) } },
        data: {
          purchaseId: purchase.id,
          vehicleId: vehicleId ?? undefined,
          supplierId,
        },
      });
    }

    return tx.purchase.findUniqueOrThrow({
      where: { id: purchase.id },
      include: {
        fees: true,
        supplier: true,
        vehicle: { include: { brand: true, carModel: true, depot: true } },
        payments: true,
        documents: { include: { uploadedBy: { select: { name: true, email: true } } } },
        stockMovements: true,
      },
    });
  });
}

export async function getPurchaseDetail(id: string) {
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      fees: true,
      supplier: true,
      vehicle: { include: { brand: true, carModel: true, depot: true, sale: true } },
      payments: { orderBy: { paidAt: "desc" } },
      documents: { include: { uploadedBy: { select: { name: true, email: true } } } },
      stockMovements: { include: { toDepot: true } },
    },
  });
}

export async function deletePurchase(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { vehicle: { include: { sale: true } } },
  });
  if (!purchase) return { error: "Achat introuvable", status: 404 };
  if (purchase.vehicle?.sale) {
    return { error: "Impossible de supprimer : véhicule déjà vendu", status: 409 };
  }
  if (purchase.vehicle?.status === "SOLD") {
    return { error: "Impossible de supprimer : véhicule vendu", status: 409 };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { purchaseId: id } });
    await tx.document.updateMany({
      where: { purchaseId: id },
      data: { purchaseId: null },
    });
    await tx.stockMovement.deleteMany({ where: { purchaseId: id } });
    await tx.purchaseFee.deleteMany({ where: { purchaseId: id } });
    await tx.purchase.delete({ where: { id } });
    if (purchase.vehicleId) {
      await tx.vehicle.delete({ where: { id: purchase.vehicleId } });
    }
  });

  return { ok: true };
}

export async function getPurchaseSummary(id: string) {
  const p = await getPurchaseDetail(id);
  if (!p) return null;
  const paid = p.payments.reduce((a, pay) => a + Number(pay.amount), 0);
  const due = Number(p.totalPurchasePrice);
  return {
    purchase: p,
    totalDue: due,
    totalPaid: paid,
    balance: Math.max(0, due - paid),
    paymentStatus: purchasePaymentStatusFromAmounts(due, paid),
    feesTotal: sumFees(p.fees),
  };
}

type PurchaseForWizard = {
  supplierId: string;
  invoiceNumber: string | null;
  purchaseDate: Date;
  invoiceDate: Date | null;
  purchaseType: PurchaseWizardValues["invoice"]["purchaseType"];
  amountHT: unknown;
  taxAmount: unknown;
  discount: unknown;
  notes: string | null;
  fees: {
    id: string;
    type: PurchaseFeeType;
    label: string | null;
    amount: unknown;
    expenseDate: Date;
    notes: string | null;
  }[];
  vehicle: {
    brandId: string;
    modelId: string;
    version: string | null;
    year: number;
    firstRegistrationDate: Date | null;
    mileage: number;
    fuel: FuelType | null;
    transmission: TransmissionType | null;
    fiscalPower: number | null;
    engineSize: string | null;
    color: string | null;
    interiorColor: string | null;
    vin: string | null;
    plate: string | null;
    matriculeW: string | null;
    origin: VehicleOrigin;
    originCountry: string | null;
    vehicleCondition: VehicleCondition | null;
    status: VehicleStatus;
    depotId: string;
    targetSalePrice: unknown;
    conditionNotes: string | null;
    internalRef: string;
  } | null;
  payments: {
    id: string;
    amount: unknown;
    paidAt: Date;
    method: PaymentMethod;
    reference: string | null;
    bank: string | null;
    checkNumber: string | null;
    dueDate: Date | null;
    notes: string | null;
  }[];
  documents: {
    id: string;
    category: string;
    originalName: string;
    path: string;
  }[];
};

export function buildWizardFromPurchase(p: PurchaseForWizard): PurchaseWizardValues {
  const v = p.vehicle;
  const amountHT = Number(p.amountHT);
  const taxAmount = Number(p.taxAmount);
  const taxRatePercent =
    amountHT > 0 ? Math.round((taxAmount / amountHT) * 1000) / 10 : 20;
  return {
    supplierId: p.supplierId,
    invoice: {
      invoiceNumber: p.invoiceNumber ?? "",
      purchaseDate: p.purchaseDate.toISOString().slice(0, 10),
      invoiceDate: p.invoiceDate?.toISOString().slice(0, 10) ?? "",
      purchaseType: p.purchaseType,
      taxRatePercent,
      amountHT,
      taxAmount,
      notes: p.notes ?? "",
      fees: p.fees.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label ?? "",
        amount: Number(f.amount),
        notes: f.notes ?? "",
      })),
    },
    vehicle: {
      brandId: v?.brandId ?? "",
      modelId: v?.modelId ?? "",
      version: v?.version ?? "",
      year: v?.year ?? new Date().getFullYear(),
      firstRegistrationDate: v?.firstRegistrationDate?.toISOString().slice(0, 10) ?? "",
      mileage: v?.mileage ?? 0,
      fuel: v?.fuel ?? "",
      transmission: v?.transmission ?? "",
      fiscalPower: v?.fiscalPower ?? undefined,
      engineSize: v?.engineSize ?? "",
      color: v?.color ?? "",
      interiorColor: v?.interiorColor ?? "",
      vin: v?.vin ?? "",
      plate: v?.plate ?? "",
      matriculeW: v?.matriculeW ?? "",
      origin: v?.origin ?? "USED",
      originCountry: v?.originCountry ?? "",
      vehicleCondition: v?.vehicleCondition ?? undefined,
      status:
        v?.status === "IN_TRANSIT" ||
        v?.status === "PREPARATION" ||
        v?.status === "IN_REPAIR"
          ? v.status
          : "IN_STOCK",
      depotId: v?.depotId ?? "",
      targetSalePrice: v?.targetSalePrice ? Number(v.targetSalePrice) : undefined,
      conditionNotes: v?.conditionNotes ?? "",
      internalRef: v?.internalRef ?? "",
    },
    payments: p.payments.map((pay) => ({
      id: pay.id,
      amount: Number(pay.amount),
      paidAt: pay.paidAt.toISOString().slice(0, 10),
      method: pay.method,
      reference: pay.reference ?? "",
      bank: pay.bank ?? "",
      checkNumber: pay.checkNumber ?? "",
      dueDate: pay.dueDate?.toISOString().slice(0, 10) ?? "",
      notes: pay.notes ?? "",
    })),
    documents: p.documents.map((d) => ({
      id: d.id,
      category: d.category,
      originalName: d.originalName,
      path: d.path,
    })),
  };
}
