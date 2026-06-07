import type { jsPDF } from "jspdf";
import { applyCompanyFooter, applyCompanyHeader } from "@/lib/pdf/company-branding";
import type {
  DeliveryNoteDocumentData,
  DocumentChecklistItem,
  DocumentMetaItem,
  ExitVoucherDocumentData,
  SalesInvoiceDocumentData,
} from "@/lib/documents/types";
import { formatMoney } from "@/lib/utils";

const NAVY = { r: 12, g: 13, b: 18 } as const;
const GOLD = { r: 184, g: 148, b: 31 } as const;
const MUTED = { r: 80, g: 85, b: 100 } as const;

function drawAccentBar(doc: jsPDF, y: number) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(14, y, w - 28, 1.2, "F");
}

function drawMetaGrid(doc: jsPDF, items: DocumentMetaItem[], startY: number): number {
  const ml = 14;
  const colW = (doc.internal.pageSize.getWidth() - 28) / 2;
  const y = startY;
  doc.setFontSize(8);
  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = ml + col * colW;
    const yy = y + row * 11;
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, x, yy);
    doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, x, yy + 4, { maxWidth: colW - 4 });
  });
  const rows = Math.ceil(items.length / 2);
  return y + rows * 11 + 4;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(244, 245, 247);
  doc.rect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
  doc.text(title.toUpperCase(), 16, y + 1);
  return y + 10;
}

function drawKeyValues(
  doc: jsPDF,
  rows: [string, string][],
  startY: number,
  maxWidth = 180
): number {
  let y = startY;
  doc.setFontSize(9);
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(`${label}`, 16, y);
    doc.setTextColor(30, 33, 48);
    doc.text(value, 62, y, { maxWidth });
    y += 5.5;
  });
  return y + 2;
}

function drawChecklist(doc: jsPDF, items: DocumentChecklistItem[], startY: number): number {
  let y = startY;
  doc.setFontSize(9);
  items.forEach((item) => {
    const mark = item.checked === true ? "[x]" : item.checked === false ? "[ ]" : "( )";
    doc.setTextColor(30, 33, 48);
    doc.text(`${mark}  ${item.label}`, 18, y);
    y += 5.5;
  });
  return y + 4;
}

function drawInstructionBox(doc: jsPDF, text: string, y: number): number {
  const w = doc.internal.pageSize.getWidth() - 28;
  doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 252, 245);
  const lines = doc.splitTextToSize(text, w - 8);
  const h = lines.length * 4.5 + 8;
  doc.roundedRect(14, y, w, h, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setTextColor(30, 33, 48);
  doc.text(lines, 18, y + 6);
  return y + h + 6;
}

function drawSignatures(doc: jsPDF, labels: string[], y: number) {
  const w = doc.internal.pageSize.getWidth();
  const slot = (w - 28) / labels.length;
  labels.forEach((label, i) => {
    const x = 14 + i * slot;
    doc.setFontSize(8);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(label, x, y);
    doc.setDrawColor(180, 180, 180);
    doc.line(x, y + 14, x + slot - 8, y + 14);
  });
}

function drawQr(doc: jsPDF, qrDataUrl: string, x: number, y: number, size: number) {
  doc.addImage(qrDataUrl, "PNG", x, y, size, size);
  doc.setFontSize(7);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Scan sécurisé", x, y + size + 4);
}

export async function renderExitVoucherPdf(
  doc: jsPDF,
  data: ExitVoucherDocumentData,
  qrDataUrl: string
) {
  let y = await applyCompanyHeader(doc, { title: "BON DE SORTIE VÉHICULE", subtitle: data.reference });
  y += 2;
  drawAccentBar(doc, y);
  y += 6;
  y = drawMetaGrid(doc, data.meta.slice(0, 6), y);
  drawQr(doc, qrDataUrl, doc.internal.pageSize.getWidth() - 58, 42, 44);

  y = drawSectionTitle(doc, "Client", y);
  y = drawKeyValues(doc, [
    ["Nom / raison sociale", data.client.name],
    ["CIN / ICE", data.client.cin ?? data.client.ice ?? "—"],
    ["Téléphone", data.client.phone ?? "—"],
    ["Adresse", data.client.address ?? "—"],
  ], y);

  y = drawSectionTitle(doc, "Véhicule", y);
  y = drawKeyValues(doc, [
    ["Marque / modèle", data.vehicle.title],
    ["Version", data.vehicle.version ?? "—"],
    ["Année", String(data.vehicle.year)],
    ["Couleur", data.vehicle.color ?? "—"],
    ["Immatriculation", data.vehicle.plate ?? "—"],
    ["N° châssis", data.vehicle.vin ?? "—"],
    ["Kilométrage", `${data.vehicle.mileage.toLocaleString("fr-FR")} km`],
    ["Dépôt actuel", data.depotName],
  ], y);

  y = drawInstructionBox(doc, data.instruction, y);
  y = drawSectionTitle(doc, "Checklist magasinier", y);
  y = drawChecklist(doc, data.checklist, y);
  drawSignatures(doc, ["Signature magasinier", "Signature responsable / commercial", "Date & heure sortie"], y);
  await applyCompanyFooter(doc, 1);
}

export async function renderDeliveryNotePdf(
  doc: jsPDF,
  data: DeliveryNoteDocumentData,
  qrDataUrl: string
) {
  let y = await applyCompanyHeader(doc, { title: "BON DE LIVRAISON VÉHICULE", subtitle: data.reference });
  y += 2;
  drawAccentBar(doc, y);
  y += 6;
  y = drawMetaGrid(doc, data.meta, y);
  drawQr(doc, qrDataUrl, doc.internal.pageSize.getWidth() - 58, 42, 44);

  y = drawSectionTitle(doc, "Client", y);
  y = drawKeyValues(
    doc,
    [
      ["Nom / raison sociale", data.client.name],
      ["CIN / ICE", data.client.cin ?? data.client.ice ?? "—"],
      ["Téléphone", data.client.phone ?? "—"],
      ["Adresse", data.client.address ?? "—"],
    ],
    y
  );

  y = drawSectionTitle(doc, "Véhicule", y);
  y = drawKeyValues(
    doc,
    [
      ["Marque / modèle", data.vehicle.title],
      ["Version", data.vehicle.version ?? "—"],
      ["Année", String(data.vehicle.year)],
      ["Couleur", data.vehicle.color ?? "—"],
      ["Immatriculation", data.vehicle.plate ?? "—"],
      ["N° châssis", data.vehicle.vin ?? "—"],
      ["Kilométrage", `${data.vehicle.mileage.toLocaleString("fr-FR")} km`],
      ["Carburant", data.vehicle.fuel ?? "—"],
      ["Boîte", data.vehicle.transmission ?? "—"],
    ],
    y
  );

  y = drawSectionTitle(doc, "Livraison", y);
  y = drawKeyValues(
    doc,
    [
      ["Dépôt", data.depotName],
      ["Adresse", data.depotAddress ?? "—"],
      ["Magasinier", data.warehouseUser ?? "—"],
      ["Date / heure", "_________________________"],
      ["Lieu", data.depotAddress ?? data.depotName],
      ["Observations", "_____________________________________________"],
    ],
    y
  );

  y = drawInstructionBox(doc, data.clientMessage, y);
  y = drawSectionTitle(doc, "Checklist livraison", y);
  y = drawChecklist(doc, data.checklist, y);
  drawSignatures(doc, ["Signature client", "Signature magasinier", "Responsable SOFISMART"], y);
  await applyCompanyFooter(doc, 1);
}

export async function renderSalesInvoicePdf(doc: jsPDF, data: SalesInvoiceDocumentData) {
  const ml = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = await applyCompanyHeader(doc, {
    title: "FACTURE DE VENTE",
    subtitle: `N° ${data.invoiceNumber} · Vente ${data.saleReference}`,
  });
  y += 2;
  drawAccentBar(doc, y);
  y += 4;
  doc.setFontSize(9);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(`Date facture : ${new Date(data.invoiceDate).toLocaleDateString("fr-FR")}`, pageWidth - ml, y, {
    align: "right",
  });
  doc.text(`Statut : ${data.statusLabel}`, pageWidth - ml, y + 5, { align: "right" });
  y += 12;

  const half = (pageWidth - 28) / 2;
  y = drawSectionTitle(doc, "Vendeur", y);
  const sellerLines = [
    data.company.tradeName ?? data.company.legalName,
    data.company.legalForm,
    [data.company.ice && `ICE : ${data.company.ice}`, data.company.rc && `RC : ${data.company.rc}`]
      .filter(Boolean)
      .join(" · "),
    [data.company.address, data.company.city, data.company.country].filter(Boolean).join(", "),
    [data.company.phone && `Tél. ${data.company.phone}`, data.company.email].filter(Boolean).join(" · "),
  ].filter(Boolean) as string[];
  doc.setFontSize(8);
  sellerLines.forEach((line, i) => {
    doc.setTextColor(30, 33, 48);
    doc.text(line, ml, y + i * 4.5, { maxWidth: half - 4 });
  });

  const clientY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CLIENT", ml + half, clientY - 6);
  doc.setFont("helvetica", "normal");
  const clientRows = [
    data.client.name,
    data.client.ice ? `ICE : ${data.client.ice}` : null,
    data.client.cin ? `CIN : ${data.client.cin}` : null,
    data.client.address,
    data.client.phone ? `Tél. ${data.client.phone}` : null,
  ].filter(Boolean) as string[];
  clientRows.forEach((line, i) => {
    doc.text(line, ml + half, clientY + i * 4.5, { maxWidth: half - 4 });
  });
  y = Math.max(y + sellerLines.length * 4.5, clientY + clientRows.length * 4.5) + 8;

  y = drawSectionTitle(doc, "Véhicule vendu", y);
  y = drawKeyValues(
    doc,
    [
      ["Désignation", data.vehicle.title],
      ["Année / km", `${data.vehicle.year} · ${data.vehicle.mileage.toLocaleString("fr-FR")} km`],
      ["Immatriculation", data.vehicle.plate ?? "—"],
      ["Châssis", data.vehicle.vin ?? "—"],
      ["Couleur / origine", [data.vehicle.color, data.vehicle.origin].filter(Boolean).join(" · ") || "—"],
    ],
    y
  );

  y = drawSectionTitle(doc, "Détail facture", y);
  const cols = [ml, 95, 118, 140, 162];
  doc.setFillColor(244, 245, 247);
  doc.rect(ml, y, pageWidth - ml * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  ["Désignation", "Qté", "P.U. HT", "TVA", "Total HT"].forEach((h, i) => {
    doc.text(h, cols[i], y + 5);
  });
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const line = data.lines[0];
  if (line) {
    doc.text(line.designation, cols[0], y, { maxWidth: 76 });
    doc.text(String(line.quantity), cols[1], y);
    doc.text(line.unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), cols[2], y);
    doc.text(`${line.taxRate} %`, cols[3], y);
    doc.text(line.totalHt.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), cols[4], y);
    y += 14;
  }

  const totalsX = pageWidth - ml - 58;
  const totals: [string, string][] = [
    ["Total HT", formatMoney(data.totals.priceHt)],
    ...(data.totals.discount > 0 ? [["Remise", `- ${formatMoney(data.totals.discount)}`] as [string, string]] : []),
    ["Base HT", formatMoney(data.totals.baseHt)],
    [`TVA`, formatMoney(data.totals.taxAmount)],
    ["Total TTC", formatMoney(data.totals.totalTtc)],
    ["Montant payé", formatMoney(data.totals.paid)],
    ["Reste à payer", formatMoney(data.totals.balance)],
  ];
  totals.forEach(([label, value]) => {
    doc.setFont("helvetica", label === "Total TTC" ? "bold" : "normal");
    doc.text(label, totalsX, y);
    doc.text(value, pageWidth - ml, y, { align: "right" });
    y += 5;
  });

  y += 6;
  if (data.payments.length) {
    y = drawSectionTitle(doc, "Paiements", y);
    data.payments.forEach((p) => {
      doc.text(
        `${p.date} — ${p.method} — ${formatMoney(p.amount)}${p.reference ? ` (${p.reference})` : ""}`,
        ml,
        y
      );
      y += 5;
    });
  }

  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  data.legalMentions.forEach((m) => {
    doc.text(m, ml, y, { maxWidth: pageWidth - ml * 2 });
    y += 4;
  });

  await applyCompanyFooter(doc, 1);
}
