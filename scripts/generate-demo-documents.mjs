#!/usr/bin/env node
/**
 * Génère les PDF de démonstration dans public/demo-documents/
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jsPDF } from "jspdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dir = path.join(root, "public", "demo-documents");

const DOCS = [
  { file: "facture-achat-demo.pdf", title: "FACTURE ACHAT — DÉMO", subtitle: "Fournisseur Test Auto SARL" },
  { file: "bon-sortie-demo.pdf", title: "BON DE SORTIE — DÉMO", subtitle: "Véhicule REF TEST-001" },
  { file: "bon-livraison-demo.pdf", title: "BON DE LIVRAISON — DÉMO", subtitle: "Client Test Démo" },
  { file: "facture-vente-demo.pdf", title: "FACTURE VENTE — DÉMO", subtitle: "SOFISMART TEST" },
  { file: "proforma-demo.pdf", title: "FACTURE PROFORMA — DÉMO", subtitle: "DOCUMENT PROVISOIRE" },
];

function buildPdf(title, subtitle) {
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

await mkdir(dir, { recursive: true });
for (const d of DOCS) {
  await writeFile(path.join(dir, d.file), buildPdf(d.title, d.subtitle));
  console.log(`  ✓ ${d.file}`);
}
console.log(`\n${DOCS.length} PDF créés dans public/demo-documents/`);
