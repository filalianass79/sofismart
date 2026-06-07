import { mkdir, writeFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { nextDeliveryNoteReference } from "@/lib/references";
import { createAuditLog } from "@/lib/audit";
import { loadDeliveryNoteDocument } from "@/lib/documents/loaders";
import { upsertGeneratedDocument, logDocumentAction } from "@/lib/documents/document-history-service";
import { renderDeliveryNotePdf } from "@/lib/pdf/commercial-document-pdf";
import { generateSecureToken } from "@/lib/services/exit-voucher-service";
import { assertDepotAccess } from "@/lib/warehouse/depot-scope";
import type { ConfirmDeliveryInput, DeliveryChecklist } from "@/lib/validations/warehouse";
export { deliveryNoteScanUrl } from "@/lib/documents/scan-urls";

const DEFAULT_CHECKLIST: DeliveryChecklist = {
  vehicleDelivered: false,
  registrationCard: false,
  keysHanded: false,
  documentsHanded: false,
  accessoriesHanded: false,
  visualInspection: false,
  clientSignature: false,
};

export async function generateDeliveryNoteForSale(saleId: string, actorUserId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      client: true,
      vehicle: { include: { brand: true, carModel: true, depot: true } },
      exitVoucher: true,
      deliveryNote: true,
    },
  });
  if (!sale) throw new Error("Vente introuvable");
  if (sale.status !== "VALIDATED") throw new Error("La vente doit être validée");
  if (!sale.clientId) throw new Error("Client manquant");
  if (sale.deliveryStatus === "DELIVERED") throw new Error("Véhicule déjà livré");
  if (!sale.exitVoucher || sale.exitVoucher.status === "CANCELLED") {
    throw new Error("Bon de sortie requis et valide");
  }

  const depotId = sale.depotId ?? sale.vehicle.depotId;
  await assertDepotAccess(actorUserId, depotId);

  if (sale.deliveryNote) {
    if (!sale.deliveryNote.pdfUrl) {
      const pdfUrl = await generateDeliveryNotePdf(sale.deliveryNote.id);
      return prisma.deliveryNote.update({
        where: { id: sale.deliveryNote.id },
        data: { pdfUrl, status: "GENERATED" },
        include: { sale: true, client: true, vehicle: { include: { brand: true, carModel: true } }, exitVoucher: true },
      });
    }
    return sale.deliveryNote;
  }

  const reference = await nextDeliveryNoteReference(prisma);
  const qrToken = generateSecureToken();

  const note = await prisma.deliveryNote.create({
    data: {
      reference,
      saleId: sale.id,
      vehicleId: sale.vehicleId,
      clientId: sale.clientId,
      depotId,
      exitVoucherId: sale.exitVoucher.id,
      generatedById: actorUserId,
      qrToken,
      status: "GENERATED",
      checklist: DEFAULT_CHECKLIST,
    },
  });

  const pdfUrl = await generateDeliveryNotePdf(note.id);

  const updated = await prisma.deliveryNote.update({
    where: { id: note.id },
    data: { pdfUrl },
    include: {
      sale: { include: { commercial: true } },
      client: true,
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      exitVoucher: true,
      generatedBy: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    actorUserId,
    action: "DELIVERY_NOTE_GENERATED",
    module: "magasin",
    targetType: "DeliveryNote",
    targetId: note.id,
    newValues: { reference, saleId },
  });

  return updated;
}

export async function generateDeliveryNotePdf(deliveryNoteId: string) {
  const dn = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    include: {
      sale: { include: { commercial: true } },
      client: true,
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      exitVoucher: true,
      generatedBy: true,
    },
  });
  if (!dn) throw new Error("Bon de livraison introuvable");

  const docData = await loadDeliveryNoteDocument(dn.id);
  const qrDataUrl = await QRCode.toDataURL(docData.qrScanUrl, { width: 200, margin: 1 });
  const doc = new jsPDF();
  await renderDeliveryNotePdf(doc, docData, qrDataUrl);

  const dir = path.join(process.cwd(), "public", "uploads", "delivery-notes");
  await mkdir(dir, { recursive: true });
  const fileName = `${dn.reference.replace(/\//g, "-")}.pdf`;
  const relPath = `/uploads/delivery-notes/${fileName}`;
  await writeFile(path.join(dir, fileName), Buffer.from(doc.output("arraybuffer")));

  const genDoc = await upsertGeneratedDocument({
    type: "DELIVERY_NOTE",
    reference: dn.reference,
    saleId: dn.saleId,
    vehicleId: dn.vehicleId,
    clientId: dn.clientId,
    depotId: dn.depotId,
    deliveryNoteId: dn.id,
    exitVoucherId: dn.exitVoucherId,
    pdfUrl: relPath,
    status: "GENERATED",
    generatedById: dn.generatedById,
  });
  await logDocumentAction(genDoc.id, "PDF_GENERATED", dn.generatedById);

  return relPath;
}

export async function confirmDeliveryNote(
  deliveryNoteId: string,
  actorUserId: string,
  input: ConfirmDeliveryInput
) {
  const dn = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    include: {
      sale: true,
      vehicle: true,
      exitVoucher: true,
      documents: { where: { type: "SIGNED_DELIVERY_NOTE" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!dn) throw new Error("Bon de livraison introuvable");
  if (dn.status === "DELIVERED" || dn.status === "SIGNED_UPLOADED") {
    throw new Error("Livraison déjà confirmée");
  }
  if (dn.status === "CANCELLED") throw new Error("Bon de livraison annulé");

  await assertDepotAccess(actorUserId, dn.depotId);

  const company = await prisma.companyProfile.findUnique({ where: { id: "default" } });
  const signedRequired = company?.signedDeliveryRequired ?? true;
  const hasSigned =
    !!input.signedDocumentUrl ||
    !!dn.signedDocumentUrl ||
    dn.documents.length > 0;

  if (signedRequired && !hasSigned) {
    throw new Error("Le bon de livraison signé par le client est obligatoire.");
  }

  const deliveredAt = new Date();
  const deliveryDate = new Date(input.deliveryDate);

  await prisma.$transaction(async (tx) => {
    await tx.deliveryNote.update({
      where: { id: deliveryNoteId },
      data: {
        status: hasSigned ? "SIGNED_UPLOADED" : "DELIVERED",
        deliveredAt,
        deliveryDate,
        deliveryTime: input.deliveryTime ?? null,
        mileageAtDelivery: input.mileageAtDelivery ?? null,
        checklist: input.checklist,
        observations: input.observations ?? null,
        deliveredById: actorUserId,
        signedDocumentUrl: input.signedDocumentUrl ?? dn.signedDocumentUrl,
      },
    });

    if (dn.exitVoucherId) {
      await tx.exitVoucher.update({
        where: { id: dn.exitVoucherId },
        data: {
          status: "DELIVERED",
          deliveredAt,
          deliveredById: actorUserId,
          deliveryNotes: input.observations ?? null,
        },
      });
    }

    await tx.sale.update({
      where: { id: dn.saleId },
      data: { deliveryStatus: "DELIVERED" },
    });

    await tx.vehicle.update({
      where: { id: dn.vehicleId },
      data: { status: "DELIVERED", finalSalePrice: dn.sale.finalPrice },
    });

    await tx.stockMovement.updateMany({
      where: {
        saleId: dn.saleId,
        movementType: "SALE_EXIT_PENDING",
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
        movementType: "SALE_EXIT_CONFIRMED",
        completedAt: deliveredAt,
        completedById: actorUserId,
        reason: "Livraison confirmée",
      },
    });

  });

  const { dispatchNotificationEventAsync } = await import("@/lib/notifications/notification-dispatcher");
  dispatchNotificationEventAsync({
    eventType: "DELIVERY_CONFIRMED",
    userIds: dn.sale.commercialId ? [dn.sale.commercialId] : [],
    module: "magasin",
    actionUrl: `/dashboard/sales/${dn.saleId}`,
    category: "SUCCESS",
    payload: {
      saleReference: dn.sale.reference,
      message: `La vente ${dn.sale.reference} a été livrée au client.`,
      actionUrl: `/dashboard/sales/${dn.saleId}`,
    },
  });

  await createAuditLog({
    actorUserId,
    action: "DELIVERY_CONFIRMED",
    module: "magasin",
    targetType: "DeliveryNote",
    targetId: deliveryNoteId,
    newValues: { deliveryDate: input.deliveryDate },
  });

  return prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    include: {
      sale: true,
      client: true,
      vehicle: { include: { brand: true, carModel: true } },
      exitVoucher: true,
      documents: true,
      deliveredBy: { select: { name: true } },
    },
  });
}

export async function uploadSignedDeliveryDocument(
  deliveryNoteId: string,
  actorUserId: string,
  file: { fileName: string; fileUrl: string; mimeType: string; size: number },
  meta?: { title?: string; notes?: string }
) {
  const dn = await prisma.deliveryNote.findUnique({ where: { id: deliveryNoteId } });
  if (!dn) throw new Error("Bon de livraison introuvable");
  await assertDepotAccess(actorUserId, dn.depotId);

  const doc = await prisma.deliveryDocument.create({
    data: {
      deliveryNoteId,
      saleId: dn.saleId,
      vehicleId: dn.vehicleId,
      clientId: dn.clientId,
      type: "SIGNED_DELIVERY_NOTE",
      title: meta?.title ?? "Bon de livraison signé",
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileMimeType: file.mimeType,
      fileSize: file.size,
      uploadedById: actorUserId,
      notes: meta?.notes,
    },
  });

  await prisma.deliveryNote.update({
    where: { id: deliveryNoteId },
    data: {
      signedDocumentUrl: file.fileUrl,
      status: dn.status === "DELIVERED" || dn.status === "SIGNED_UPLOADED" ? dn.status : "GENERATED",
    },
  });

  await createAuditLog({
    actorUserId,
    action: "DELIVERY_SIGNED_UPLOADED",
    module: "magasin",
    targetType: "DeliveryDocument",
    targetId: doc.id,
  });

  return doc;
}
