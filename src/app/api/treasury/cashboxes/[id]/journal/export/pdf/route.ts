import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { getCashboxJournal } from "@/lib/services/cashbox-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.export");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const box = await prisma.cashbox.findUnique({ where: { id }, select: { name: true, reference: true } });
  const journal = await getCashboxJournal(gate.actor, id, {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(`Journal de caisse — ${box?.name ?? id}`, 14, 16);
  doc.setFontSize(10);
  doc.text(box?.reference ?? "", 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Réf.", "Type", "Libellé", "Débit", "Crédit", "Solde", "Statut"]],
    body: journal.rows.map((r) => [
      new Date(r.operationDate).toLocaleDateString("fr-FR"),
      r.reference,
      r.type,
      r.reason.slice(0, 40),
      r.debit ? String(r.debit) : "",
      r.credit ? String(r.credit) : "",
      r.runningBalance != null ? String(r.runningBalance) : "",
      r.status,
    ]),
    styles: { fontSize: 8 },
  });

  const pdf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="journal-caisse-${id}.pdf"`,
    },
  });
}
