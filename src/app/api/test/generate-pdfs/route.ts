import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import { getAppEnvironment } from "@/lib/app-env";

export const runtime = "nodejs";

const DOCS = [
  { file: "facture-achat-demo.pdf", title: "FACTURE ACHAT — DÉMO", subtitle: "Fournisseur Test Auto SARL" },
  { file: "bon-sortie-demo.pdf", title: "BON DE SORTIE — DÉMO", subtitle: "Véhicule REF TEST-001" },
  { file: "bon-livraison-demo.pdf", title: "BON DE LIVRAISON — DÉMO", subtitle: "Client Test Démo" },
  { file: "facture-vente-demo.pdf", title: "FACTURE VENTE — DÉMO", subtitle: "SOFISMART TEST" },
  { file: "proforma-demo.pdf", title: "FACTURE PROFORMA — DÉMO", subtitle: "DOCUMENT PROVISOIRE" },
];

function buildPdf(title: string, subtitle: string): Buffer {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 20, 30);
  doc.setFontSize(11);
  doc.text(subtitle, 20, 42);
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 20, 55);
  doc.text("ENVIRONNEMENT TEST — DONNÉES NON CONTRACTUELLES", 20, 65);
  doc.setDrawColor(200, 80, 0);
  doc.rect(15, 20, 180, 55);
  return Buffer.from(doc.output("arraybuffer"));
}

export async function POST() {
  const env = getAppEnvironment();
  if (env === "production" && process.env.ENABLE_DEBUG_MODE !== "true") {
    return NextResponse.json({ error: "Indisponible en production" }, { status: 403 });
  }

  const dir = path.join(process.cwd(), "public", "demo-documents");
  await mkdir(dir, { recursive: true });

  const written: string[] = [];
  for (const d of DOCS) {
    const buf = buildPdf(d.title, d.subtitle);
    await writeFile(path.join(dir, d.file), buf);
    written.push(`/demo-documents/${d.file}`);
  }

  return NextResponse.json({
    ok: true,
    message: `${written.length} PDF de démonstration générés.`,
    files: written,
  });
}

export async function GET() {
  return NextResponse.json({
    docs: DOCS.map((d) => `/demo-documents/${d.file}`),
    hint: "POST pour régénérer les PDF TEST",
  });
}
