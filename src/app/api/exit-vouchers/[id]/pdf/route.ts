import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { generateExitVoucherPdf } from "@/lib/services/exit-voucher-service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("ventes.view");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const voucher = await prisma.exitVoucher.findUnique({ where: { id } });
  if (!voucher) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let pdfPath = voucher.pdfPath;
  if (!pdfPath) {
    pdfPath = await generateExitVoucherPdf(id);
    await prisma.exitVoucher.update({ where: { id }, data: { pdfPath } });
  }

  const abs = path.join(process.cwd(), "public", pdfPath.replace(/^\//, ""));
  const buf = await readFile(abs);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${voucher.reference}.pdf"`,
    },
  });
}
