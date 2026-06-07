import type { PrismaClient } from "@/generated/prisma/client";

type Db = Pick<
  PrismaClient,
  "depot" | "sale" | "supplier" | "payment" | "exitVoucher" | "deliveryNote" | "proformaInvoice" | "$queryRaw"
>;

export async function nextDepotReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEP-${year}-`;
  const last = await db.depot.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextSaleReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VTE-${year}-`;
  const last = await db.sale.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextSupplierReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FRN-${year}-`;
  const last = await db.supplier.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextPaymentReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;
  const last = await db.payment.findFirst({
    where: { paymentReference: { startsWith: prefix } },
    orderBy: { paymentReference: "desc" },
    select: { paymentReference: true },
  });
  const seq = last?.paymentReference ? parseInt(last.paymentReference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextSaleInvoiceReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FACT-${year}-`;
  const pattern = `${prefix}%`;

  const rows = await db.$queryRaw<{ invoiceNumber: string }[]>`
    SELECT "invoiceNumber" FROM "Sale"
    WHERE "invoiceNumber" IS NOT NULL AND "invoiceNumber" LIKE ${pattern}
    ORDER BY "invoiceNumber" DESC
    LIMIT 1
  `;
  const last = rows[0]?.invoiceNumber;
  const seq = last ? parseInt(last.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextExitVoucherReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BSV-${year}-`;
  const last = await db.exitVoucher.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextDeliveryNoteReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BLV-${year}-`;
  const last = await db.deliveryNote.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextProformaReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRO-${year}-`;
  const last = await db.proformaInvoice.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
