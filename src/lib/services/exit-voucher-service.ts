import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { nextExitVoucherReference } from "@/lib/references";
import { createAuditLog } from "@/lib/audit";
import { loadExitVoucherDocument } from "@/lib/documents/loaders";
import { upsertGeneratedDocument, logDocumentAction } from "@/lib/documents/document-history-service";
import { renderExitVoucherPdf } from "@/lib/pdf/commercial-document-pdf";
import { dispatchNotificationEventAsync } from "@/lib/notifications/notification-dispatcher";
import type { Prisma } from "@/generated/prisma/client";

const VEHICLE_SALEABLE = ["IN_STOCK", "RESERVED", "PREPARATION"] as const;

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export { exitVoucherScanUrl } from "@/lib/documents/scan-urls";

export async function createExitVoucherForSale(
  saleId: string,
  actorUserId?: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: {
      client: true,
      vehicle: { include: { brand: true, carModel: true, depot: true } },
      commercial: true,
      depot: true,
    },
  });
  if (!sale) throw new Error("Vente introuvable");
  if (!sale.clientId) throw new Error("Client manquant sur la vente");

  const existing = await db.exitVoucher.findUnique({ where: { saleId } });
  if (existing) return existing;

  const depotId = sale.depotId ?? sale.vehicle.depotId;
  const depot = sale.depot ?? sale.vehicle.depot;
  const warehouseUserId = depot.managerId ?? null;

  const secureToken = generateSecureToken();
  const reference = await nextExitVoucherReference(db);

  const voucher = await db.exitVoucher.create({
    data: {
      reference,
      saleId: sale.id,
      vehicleId: sale.vehicleId,
      depotId,
      assignedWarehouseUserId: warehouseUserId,
      secureToken,
      status: "PENDING",
      message:
        "Veuillez procéder à la sortie du véhicule après vérification de ce bon et confirmation de livraison.",
    },
    include: {
      sale: { include: { client: true, vehicle: { include: { brand: true, carModel: true } } } },
      depot: true,
      assignedWarehouseUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (warehouseUserId) {
    /* notification via dispatchNotificationEventAsync après génération PDF */
  }

  const pdfPath = await generateExitVoucherPdf(voucher.id, db);
  const updated = await db.exitVoucher.update({
    where: { id: voucher.id },
    data: { pdfPath },
    include: {
      sale: { include: { client: true, commercial: true } },
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      assignedWarehouseUser: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    actorUserId,
    action: "EXIT_VOUCHER_CREATED",
    module: "ventes",
    targetType: "ExitVoucher",
    targetId: voucher.id,
    newValues: { reference, saleId },
  });

  const assignee = updated.assignedWarehouseUser;
  const brandLabel = sale.vehicle.brand.label;
  const modelLabel = sale.vehicle.carModel.label;
  dispatchNotificationEventAsync({
    eventType: "EXIT_VOUCHER_GENERATED",
    depotId,
    userIds: warehouseUserId ? [warehouseUserId] : undefined,
    module: "magasin",
    actionUrl: `/dashboard/warehouse/exit-vouchers/scan/${secureToken}`,
    category: "ACTION_REQUIRED",
    attachments: [{ fileName: `${reference.replace(/\//g, "-")}.pdf`, fileUrl: pdfPath, fileMimeType: "application/pdf" }],
    payload: {
      employeeName: assignee?.name ?? "Magasinier",
      exitVoucherReference: reference,
      vehicleBrand: brandLabel,
      vehicleModel: modelLabel,
      registrationNumber: sale.vehicle.plate ?? "",
      depotName: depot.name,
      saleReference: sale.reference,
      clientName: sale.client?.name ?? "",
      documentUrl: pdfPath,
      actionUrl: `/dashboard/warehouse/exit-vouchers/scan/${secureToken}`,
    },
  });

  dispatchNotificationEventAsync({
    eventType: "SALE_VALIDATED",
    depotId,
    module: "ventes",
    actionUrl: `/dashboard/sales/${saleId}`,
    category: "SUCCESS",
    payload: {
      vehicleBrand: brandLabel,
      vehicleModel: modelLabel,
      registrationNumber: sale.vehicle.plate ?? "",
      depotName: depot.name,
      saleReference: sale.reference,
      clientName: sale.client?.name ?? "",
      actionUrl: `/dashboard/sales/${saleId}`,
    },
  });

  return updated;
}

export async function generateExitVoucherPdf(
  exitVoucherId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const v = await db.exitVoucher.findUnique({
    where: { id: exitVoucherId },
    include: {
      sale: { include: { client: true, commercial: true } },
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      assignedWarehouseUser: true,
    },
  });
  if (!v) throw new Error("Bon de sortie introuvable");

  const docData = await loadExitVoucherDocument(v.id);
  const qrDataUrl = await QRCode.toDataURL(docData.qrScanUrl, { width: 200, margin: 1 });
  const doc = new jsPDF();
  await renderExitVoucherPdf(doc, docData, qrDataUrl);

  const dir = path.join(process.cwd(), "public", "uploads", "exit-vouchers");
  await mkdir(dir, { recursive: true });
  const fileName = `${v.reference.replace(/\//g, "-")}.pdf`;
  const relPath = `/uploads/exit-vouchers/${fileName}`;
  const absPath = path.join(dir, fileName);
  const buf = Buffer.from(doc.output("arraybuffer"));
  await writeFile(absPath, buf);

  const genDoc = await upsertGeneratedDocument({
    type: "EXIT_VOUCHER",
    reference: v.reference,
    saleId: v.saleId,
    vehicleId: v.vehicleId,
    clientId: v.sale.clientId,
    depotId: v.depotId,
    exitVoucherId: v.id,
    pdfUrl: relPath,
    status: "GENERATED",
  });
  await logDocumentAction(genDoc.id, "PDF_GENERATED");

  return relPath;
}

export async function confirmExitVoucherDelivery(
  exitVoucherId: string,
  deliveredById: string,
  input: { deliveryNotes?: string; deliveryPhotoUrl?: string }
) {
  const voucher = await prisma.exitVoucher.findUnique({
    where: { id: exitVoucherId },
    include: {
      sale: true,
      vehicle: true,
      depot: true,
    },
  });
  if (!voucher) throw new Error("Bon de sortie introuvable");
  if (voucher.status === "DELIVERED") throw new Error("Bon déjà livré");
  if (voucher.status === "CANCELLED") throw new Error("Bon annulé");

  const deliverer = await prisma.user.findUnique({
    where: { id: deliveredById },
    select: { id: true, role: true, depotId: true, employee: { select: { depotId: true } } },
  });
  if (!deliverer) throw new Error("Utilisateur introuvable");

  const isAdmin = deliverer.role === "ADMIN";
  const userDepot = deliverer.employee?.depotId ?? deliverer.depotId;
  const sameDepot = userDepot === voucher.depotId;
  const isDepotManager = await prisma.depot.findFirst({
    where: { id: voucher.depotId, managerId: deliveredById },
  });
  if (!isAdmin && !sameDepot && !isDepotManager) {
    throw new Error("Vous n'êtes pas autorisé pour ce dépôt");
  }

  await prisma.$transaction(async (tx) => {
    await tx.exitVoucher.update({
      where: { id: exitVoucherId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        deliveredById,
        deliveryNotes: input.deliveryNotes ?? null,
        deliveryPhotoUrl: input.deliveryPhotoUrl || null,
      },
    });

    await tx.sale.update({
      where: { id: voucher.saleId },
      data: { deliveryStatus: "DELIVERED" },
    });

    await tx.vehicle.update({
      where: { id: voucher.vehicleId },
      data: { status: "SOLD", finalSalePrice: voucher.sale.finalPrice },
    });

    await tx.stockMovement.updateMany({
      where: {
        saleId: voucher.saleId,
        movementType: "SALE_EXIT_PENDING",
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
        movementType: "SALE_EXIT_CONFIRMED",
        completedAt: new Date(),
        completedById: deliveredById,
        reason: "Sortie vente confirmée",
      },
    });

  });

  if (voucher.sale.commercialId) {
    dispatchNotificationEventAsync({
      eventType: "DELIVERY_CONFIRMED",
      userIds: [voucher.sale.commercialId],
      module: "magasin",
      actionUrl: `/dashboard/sales/${voucher.saleId}`,
      category: "SUCCESS",
      payload: {
        saleReference: voucher.sale.reference,
        message: `Le véhicule de la vente ${voucher.sale.reference} a été livré par le magasinier.`,
        actionUrl: `/dashboard/sales/${voucher.saleId}`,
      },
    });
  }

  await createAuditLog({
    actorUserId: deliveredById,
    action: "EXIT_VOUCHER_DELIVERED",
    module: "magasin",
    targetType: "ExitVoucher",
    targetId: exitVoucherId,
  });

  return prisma.exitVoucher.findUnique({
    where: { id: exitVoucherId },
    include: { sale: true, vehicle: { include: { brand: true, carModel: true } }, depot: true },
  });
}

export function isVehicleSaleable(status: string): boolean {
  return (VEHICLE_SALEABLE as readonly string[]).includes(status);
}
