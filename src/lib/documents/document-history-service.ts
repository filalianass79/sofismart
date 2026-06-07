import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { GeneratedDocumentStatus, GeneratedDocumentType } from "@/generated/prisma/enums";

export async function upsertGeneratedDocument(params: {
  type: GeneratedDocumentType;
  reference: string;
  saleId?: string | null;
  vehicleId?: string | null;
  clientId?: string | null;
  depotId?: string | null;
  exitVoucherId?: string | null;
  deliveryNoteId?: string | null;
  pdfUrl?: string | null;
  status?: GeneratedDocumentStatus;
  generatedById?: string | null;
}) {
  const existing =
    params.exitVoucherId
      ? await prisma.generatedDocument.findUnique({ where: { exitVoucherId: params.exitVoucherId } })
      : params.deliveryNoteId
        ? await prisma.generatedDocument.findUnique({ where: { deliveryNoteId: params.deliveryNoteId } })
        : params.saleId
          ? await prisma.generatedDocument.findFirst({
              where: { type: params.type, saleId: params.saleId },
            })
          : null;

  const data = {
    type: params.type,
    reference: params.reference,
    saleId: params.saleId ?? null,
    vehicleId: params.vehicleId ?? null,
    clientId: params.clientId ?? null,
    depotId: params.depotId ?? null,
    exitVoucherId: params.exitVoucherId ?? null,
    deliveryNoteId: params.deliveryNoteId ?? null,
    pdfUrl: params.pdfUrl ?? null,
    status: params.status ?? "GENERATED",
    generatedById: params.generatedById ?? null,
    generatedAt: new Date(),
  };

  if (existing) {
    return prisma.generatedDocument.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  return prisma.generatedDocument.create({ data });
}

export async function logDocumentAction(
  documentId: string,
  action: string,
  userId?: string | null,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.documentHistory.create({
    data: {
      documentId,
      action,
      userId: userId ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

export async function recordDocumentEvent(
  lookup: {
    type: GeneratedDocumentType;
    exitVoucherId?: string;
    deliveryNoteId?: string;
    saleId?: string;
  },
  action: string,
  userId?: string | null,
  statusPatch?: Partial<{
    status: GeneratedDocumentStatus;
    sentAt: Date;
    downloadedAt: Date;
    printedAt: Date;
    signedUploadedAt: Date;
  }>
) {
  const doc = await prisma.generatedDocument.findFirst({
    where: {
      type: lookup.type,
      ...(lookup.exitVoucherId ? { exitVoucherId: lookup.exitVoucherId } : {}),
      ...(lookup.deliveryNoteId ? { deliveryNoteId: lookup.deliveryNoteId } : {}),
      ...(lookup.saleId ? { saleId: lookup.saleId } : {}),
    },
  });
  if (!doc) return null;

  if (statusPatch) {
    await prisma.generatedDocument.update({
      where: { id: doc.id },
      data: statusPatch,
    });
  }

  await logDocumentAction(doc.id, action, userId);
  return doc.id;
}

export async function getDocumentHistory(documentId: string) {
  return prisma.documentHistory.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
