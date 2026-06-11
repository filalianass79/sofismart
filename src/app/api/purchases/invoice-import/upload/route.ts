import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requirePurchaseCreateAccess } from "@/lib/api-purchase-auth";
import {
  createInvoiceImportFromFile,
  uploadInvoiceFile,
} from "@/lib/invoice-import/invoice-import-service";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Upload seul (sans extraction) — query ?extract=1 pour pipeline complet */
export async function POST(req: Request) {
  const gate = await requirePurchaseCreateAccess();
  if ("response" in gate) return gate.response;

  const session = await auth();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const url = new URL(req.url);
  const fullExtract = url.searchParams.get("extract") !== "0";

  try {
    const importId = fullExtract
      ? await createInvoiceImportFromFile(file, session?.user?.id ?? null)
      : await uploadInvoiceFile(file, session?.user?.id ?? null);
    return NextResponse.json({ importId }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur upload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
