import "server-only";

import type { GeneratedDocumentStatus } from "@/generated/prisma/enums";
import { recordDocumentEvent } from "@/lib/documents/document-history-service";
import { toGeneratedType } from "@/lib/documents/document-queries";

/** Régénération PDF — serveur uniquement (API routes). */
export async function regeneratePdf(type: string, entityId: string, userId?: string) {
  if (type === "exit-voucher") {
    const { generateExitVoucherPdf } = await import("@/lib/services/exit-voucher-service");
    await generateExitVoucherPdf(entityId);
    return;
  }
  if (type === "delivery-note") {
    const { generateDeliveryNotePdf } = await import("@/lib/services/delivery-note-service");
    await generateDeliveryNotePdf(entityId);
    return;
  }
  if (type === "sales-invoice") {
    const { regenerateSaleInvoicePdf } = await import("@/lib/services/sale-invoice-service");
    await regenerateSaleInvoicePdf(entityId, userId);
    return;
  }
  throw new Error("Type inconnu");
}

export async function logDocEvent(
  type: string,
  entityId: string,
  action: string,
  userId?: string,
  patch?: Partial<{
    status: GeneratedDocumentStatus;
    sentAt: Date;
    downloadedAt: Date;
    printedAt: Date;
    signedUploadedAt: Date;
  }>
) {
  const genType = toGeneratedType(type);
  if (!genType) return;
  await recordDocumentEvent(
    {
      type: genType,
      ...(type === "exit-voucher" ? { exitVoucherId: entityId } : {}),
      ...(type === "delivery-note" ? { deliveryNoteId: entityId } : {}),
      ...(type === "sales-invoice" ? { saleId: entityId } : {}),
    },
    action,
    userId,
    patch
  );
}
