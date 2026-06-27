import { NextResponse } from "next/server";
import { requireTreasuryActor } from "@/lib/treasury/treasury-api";
import { getCashboxJournal } from "@/lib/services/cashbox-service";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const gate = await requireTreasuryActor("caisse.export");
  if ("response" in gate) return gate.response;

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const journal = await getCashboxJournal(gate.actor, id, {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  const sheetData = journal.rows.map((r) => ({
    Date: r.operationDate,
    Référence: r.reference,
    Type: r.type,
    Libellé: r.reason,
    Débit: r.debit || "",
    Crédit: r.credit || "",
    Solde: r.runningBalance ?? "",
    Statut: r.status,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Journal");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="journal-caisse-${id}.xlsx"`,
    },
  });
}
