import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requirePurchaseCreateAccess } from "@/lib/api-purchase-auth";
import { createInvoiceImportFromFile } from "@/lib/invoice-import/invoice-import-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const gate = await requirePurchaseCreateAccess();
  if ("response" in gate) return gate.response;

  const session = await auth();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  try {
    const importId = await createInvoiceImportFromFile(file, session?.user?.id ?? null);
    return NextResponse.json({ importId }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur extraction";
    const clientError =
      /fichier|format|volumineux|non autorisé|non supporté|image impossible/i.test(msg);
    return NextResponse.json(
      { error: msg },
      { status: clientError ? 400 : 500 },
    );
  }
}
