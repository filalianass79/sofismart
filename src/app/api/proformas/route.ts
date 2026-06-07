import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { proformaInvoiceSchema } from "@/lib/validations/proforma";
import { createProforma, listProformas } from "@/lib/services/proforma-service";
import { serializeProforma } from "@/lib/proforma-serialize";
import type { ProformaStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";

function serializeRow(row: Awaited<ReturnType<typeof listProformas>>[number]) {
  return {
    ...row,
    priceHT: Number(row.priceHT),
    discount: Number(row.discount),
    taxAmount: Number(row.taxAmount),
    totalTTC: Number(row.totalTTC),
  };
}

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("proformas.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const rows = await listProformas({
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as ProformaStatus) || undefined,
    commercialId: searchParams.get("commercialId") ?? undefined,
    clientId: searchParams.get("clientId") ?? undefined,
    expired: (searchParams.get("expired") as "0" | "1") || undefined,
  });
  return NextResponse.json(rows.map(serializeRow));
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("proformas.create");
  if ("response" in gate) return gate.response;

  const parsed = proformaInvoiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const row = await createProforma(
      parsed.data,
      gate.session.user.id,
      parsed.data.saveAsDraft === true,
    );
    if (!row) throw new Error("Création impossible");
    return NextResponse.json(serializeProforma(row), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
