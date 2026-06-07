import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requirePermissionFresh } from "@/lib/api-auth";
import { getProformaById, generateProforma, recordProformaDownload } from "@/lib/services/proforma-service";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermissionFresh("proformas.export");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  try {
    let row = await getProformaById(id);
    if (!row) return NextResponse.json({ error: "Proforma introuvable" }, { status: 404 });
    if (!row.pdfUrl) {
      await generateProforma(id, gate.session.user.id);
      row = await getProformaById(id);
    }
    await recordProformaDownload(id, gate.session.user.id);
    if (!row?.pdfUrl) return NextResponse.json({ error: "PDF indisponible" }, { status: 404 });

    const filePath = path.join(process.cwd(), "public", row.pdfUrl.replace(/^\//, ""));
    const buffer = await readFile(filePath);
    const fileName = `${row.reference.replace(/\//g, "-")}.pdf`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
