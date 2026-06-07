import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { generateSaleInvoiceForSale } from "@/lib/services/sale-invoice-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  if (sale.status !== "VALIDATED") {
    return NextResponse.json({ error: "Vente non validée" }, { status: 400 });
  }

  const invoiceRows = await prisma.$queryRaw<
    { invoicePdfPath: string | null; invoiceNumber: string | null }[]
  >`
    SELECT "invoicePdfPath", "invoiceNumber" FROM "Sale" WHERE "id" = ${id} LIMIT 1
  `;
  let pdfPath = invoiceRows[0]?.invoicePdfPath ?? null;
  let invoiceNumber = invoiceRows[0]?.invoiceNumber ?? null;

  if (!pdfPath) {
    const generated = await generateSaleInvoiceForSale(id, gate.session.user.id);
    pdfPath = generated.pdfPath;
    invoiceNumber = generated.invoiceNumber;
  }

  const abs = path.join(process.cwd(), "public", pdfPath.replace(/^\//, ""));
  const buf = await readFile(abs);
  const fileName = `${invoiceNumber ?? "facture"}.pdf`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
