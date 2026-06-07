import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { nextSaleInvoiceReference } from "@/lib/references";
import { loadSalesInvoiceDocument } from "@/lib/documents/loaders";
import { upsertGeneratedDocument, logDocumentAction } from "@/lib/documents/document-history-service";
import { renderSalesInvoicePdf } from "@/lib/pdf/commercial-document-pdf";
import type { AuditPayload } from "@/lib/audit-types";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type DbClient = Prisma.TransactionClient | PrismaClient;

function isMissingTableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("GeneratedDocument") ||
    msg.includes("DocumentHistory") ||
    msg.includes("does not exist")
  );
}

function isUniqueInvoiceError(err: unknown): boolean {
  return (
    err instanceof Error &&
    ("code" in err ? (err as { code?: string }).code === "P2002" : false)
  );
}

async function safeAuditLog(payload: AuditPayload) {
  try {
    const { createAuditLog } = await import("@/lib/audit");
    await createAuditLog(payload);
  } catch {
    /* hors requête HTTP (ex. script) — ne bloque pas la facture */
  }
}

async function getSaleInvoiceNumber(db: DbClient, saleId: string): Promise<string | null> {
  const rows = await db.$queryRaw<{ invoiceNumber: string | null }[]>`
    SELECT "invoiceNumber" FROM "Sale" WHERE "id" = ${saleId} LIMIT 1
  `;
  return rows[0]?.invoiceNumber ?? null;
}

async function persistSaleInvoice(
  db: DbClient,
  saleId: string,
  invoiceNumber: string,
  pdfPath: string
) {
  await db.$executeRaw`
    UPDATE "Sale"
    SET "invoiceNumber" = ${invoiceNumber},
        "invoicePdfPath" = ${pdfPath},
        "updatedAt" = NOW()
    WHERE "id" = ${saleId}
  `;
}

async function buildInvoicePdf(saleId: string, invoiceNumber: string): Promise<string> {
  const docData = await loadSalesInvoiceDocument(saleId);
  const doc = new jsPDF();
  await renderSalesInvoicePdf(doc, { ...docData, invoiceNumber, reference: invoiceNumber });

  const dir = path.join(process.cwd(), "public", "uploads", "sale-invoices");
  await mkdir(dir, { recursive: true });
  const safeRef = invoiceNumber.replace(/\//g, "-");
  const fileName = `${safeRef}.pdf`;
  const relPath = `/uploads/sale-invoices/${fileName}`;
  await writeFile(path.join(dir, fileName), Buffer.from(doc.output("arraybuffer")));
  return relPath;
}

export async function generateSaleInvoiceForSale(
  saleId: string,
  actorUserId?: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: {
      client: true,
      vehicle: { include: { brand: true, carModel: true } },
      commercial: { select: { name: true } },
      payments: { orderBy: { paidAt: "asc" } },
      depot: { select: { name: true } },
    },
  });

  if (!sale) throw new Error("Vente introuvable");
  if (sale.status !== "VALIDATED") throw new Error("La facture ne peut être générée que pour une vente validée");
  if (!sale.clientId || !sale.client) throw new Error("Client requis pour la facture");

  try {
    const existingInvoice = await getSaleInvoiceNumber(db, saleId);
    let invoiceNumber = existingInvoice ?? (await nextSaleInvoiceReference(db));
    let pdfPath: string;

    try {
      pdfPath = await buildInvoicePdf(saleId, invoiceNumber);
      await persistSaleInvoice(db, saleId, invoiceNumber, pdfPath);
    } catch (err) {
      if (!existingInvoice && isUniqueInvoiceError(err)) {
        invoiceNumber = await nextSaleInvoiceReference(db);
        pdfPath = await buildInvoicePdf(saleId, invoiceNumber);
        await persistSaleInvoice(db, saleId, invoiceNumber, pdfPath);
      } else {
        throw err;
      }
    }

    const existingDoc = await db.document.findFirst({
      where: { saleId, category: "SALE_INVOICE" },
    });

    const docPayload = {
      category: "SALE_INVOICE" as const,
      title: `Facture ${invoiceNumber}`,
      originalName: `${invoiceNumber}.pdf`,
      path: pdfPath,
      mimeType: "application/pdf",
      saleId,
      clientId: sale.clientId,
      vehicleId: sale.vehicleId,
      uploadedById: actorUserId ?? null,
    };

    if (existingDoc) {
      await db.document.update({ where: { id: existingDoc.id }, data: docPayload });
    } else {
      await db.document.create({ data: docPayload });
    }

    const genDoc = await upsertGeneratedDocument({
      type: "SALES_INVOICE",
      reference: invoiceNumber,
      saleId,
      vehicleId: sale.vehicleId,
      clientId: sale.clientId,
      depotId: sale.depotId,
      pdfUrl: pdfPath,
      status: "GENERATED",
      generatedById: actorUserId ?? null,
    });
    await logDocumentAction(genDoc.id, "PDF_GENERATED", actorUserId);

    await safeAuditLog({
      actorUserId,
      action: "SALE_INVOICE_GENERATED",
      module: "ventes",
      targetType: "Sale",
      targetId: saleId,
      newValues: { invoiceNumber, pdfPath },
    });

    return { invoiceNumber, pdfPath };
  } catch (err) {
    if (isMissingTableError(err)) {
      throw new Error(
        "Tables documents manquantes. Exécutez : npm run db:push puis redémarrez l’application."
      );
    }
    const msg = err instanceof Error ? err.message : "Erreur lors de la génération de la facture";
    throw new Error(msg);
  }
}

export async function regenerateSaleInvoicePdf(saleId: string, actorUserId?: string) {
  return generateSaleInvoiceForSale(saleId, actorUserId);
}
