import { prisma } from "@/lib/prisma";
import { parseDocumentPreviewType } from "@/lib/documents/types";
import type { GeneratedDocumentType } from "@/generated/prisma/enums";

export function toGeneratedType(type: string): GeneratedDocumentType | null {
  const map: Record<string, GeneratedDocumentType> = {
    "exit-voucher": "EXIT_VOUCHER",
    "delivery-note": "DELIVERY_NOTE",
    "sales-invoice": "SALES_INVOICE",
  };
  return map[type] ?? null;
}

export function assertPreviewType(type: string) {
  const parsed = parseDocumentPreviewType(type);
  if (!parsed) throw new Error("Type de document invalide");
  return parsed;
}

export async function findGeneratedDoc(type: string, entityId: string) {
  const genType = toGeneratedType(type);
  if (!genType) return null;
  if (type === "exit-voucher") {
    return prisma.generatedDocument.findUnique({ where: { exitVoucherId: entityId } });
  }
  if (type === "delivery-note") {
    return prisma.generatedDocument.findUnique({ where: { deliveryNoteId: entityId } });
  }
  return prisma.generatedDocument.findFirst({
    where: { type: genType, saleId: entityId },
  });
}
