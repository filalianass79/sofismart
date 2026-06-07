import type { jsPDF } from "jspdf";
import { applyCompanyFooter, applyCompanyHeader } from "@/lib/pdf/company-branding";
import type { ProformaDocumentData } from "@/lib/documents/types";
import { formatMoney } from "@/lib/utils";

const NAVY = { r: 12, g: 13, b: 18 } as const;
const GOLD = { r: 184, g: 148, b: 31 } as const;
const MUTED = { r: 80, g: 85, b: 100 } as const;
const WARN = { r: 180, g: 83, b: 9 } as const;

function drawAccentBar(doc: jsPDF, y: number) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(14, y, w - 28, 1.2, "F");
}

function drawWarningBanner(doc: jsPDF, y: number): number {
  const w = doc.internal.pageSize.getWidth() - 28;
  doc.setFillColor(255, 243, 224);
  doc.setDrawColor(WARN.r, WARN.g, WARN.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, w, 14, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(WARN.r, WARN.g, WARN.b);
  doc.text("DOCUMENT PROVISOIRE — NON VALABLE COMME FACTURE DÉFINITIVE", 18, y + 9);
  return y + 20;
}

export async function renderProformaPdf(doc: jsPDF, data: ProformaDocumentData) {
  const ml = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = await applyCompanyHeader(doc, {
    title: "FACTURE PROFORMA",
    subtitle: data.reference,
  });
  y += 2;
  drawAccentBar(doc, y);
  y += 6;
  y = drawWarningBanner(doc, y);

  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(`Date : ${new Date(data.proformaDate).toLocaleDateString("fr-FR")}`, ml, y);
  doc.text(`Validité : ${new Date(data.validityDate).toLocaleDateString("fr-FR")}`, ml + 55, y);
  doc.text(`Commercial : ${data.commercialName ?? "—"}`, pageWidth - ml, y, { align: "right" });
  y += 10;

  const half = (pageWidth - 28) / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
  doc.text("CLIENT", ml, y);
  doc.text("VÉHICULE", ml + half, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const clientLines = [
    data.client.name,
    data.client.type === "COMPANY"
      ? [data.client.ice && `ICE : ${data.client.ice}`, data.client.rc && `RC : ${data.client.rc}`]
          .filter(Boolean)
          .join(" · ")
      : data.client.cin
        ? `CIN : ${data.client.cin}`
        : null,
    data.client.phone ? `Tél. ${data.client.phone}` : null,
    data.client.address,
  ].filter(Boolean) as string[];
  clientLines.forEach((line, i) => doc.text(line, ml, y + i * 4.5, { maxWidth: half - 4 }));

  const vehLines = [
    data.vehicle.title,
    `Année : ${data.vehicle.year} · ${data.vehicle.mileage.toLocaleString("fr-FR")} km`,
    `Immat. : ${data.vehicle.plate ?? "—"}`,
    `Châssis : ${data.vehicle.vin ?? "—"}`,
    `Couleur : ${data.vehicle.color ?? "—"}`,
    [data.vehicle.fuel, data.vehicle.transmission].filter(Boolean).join(" · ") || null,
  ].filter(Boolean) as string[];
  vehLines.forEach((line, i) => doc.text(line, ml + half, y + i * 4.5, { maxWidth: half - 4 }));
  y += Math.max(clientLines.length, vehLines.length) * 4.5 + 8;

  const cols = [ml, 78, 95, 118, 140, 162];
  doc.setFillColor(244, 245, 247);
  doc.rect(ml, y, pageWidth - ml * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  ["Désignation", "Qté", "P.U. HT", "Remise", "TVA", "Total TTC"].forEach((h, i) => {
    doc.text(h, cols[i], y + 5);
  });
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const line of data.lines) {
    doc.text(line.designation, cols[0], y, { maxWidth: 58 });
    doc.text(String(line.quantity), cols[1], y);
    doc.text(formatMoney(line.unitPriceHT), cols[2], y);
    doc.text(line.discount > 0 ? formatMoney(line.discount) : "—", cols[3], y);
    doc.text(`${line.taxRate} %`, cols[4], y);
    doc.text(formatMoney(line.totalTTC), cols[5], y);
    y += 12;
  }

  const totalsX = pageWidth - ml - 58;
  const totals: [string, string][] = [
    ["Total HT", formatMoney(data.totals.priceHT + data.totals.accessoryFees)],
    ...(data.totals.discount > 0 ? [["Remise", `- ${formatMoney(data.totals.discount)}`] as [string, string]] : []),
    ...(data.totals.accessoryFees > 0
      ? [["Frais accessoires", formatMoney(data.totals.accessoryFees)] as [string, string]]
      : []),
    ["Base HT", formatMoney(data.totals.baseHT)],
    ["TVA", formatMoney(data.totals.taxAmount)],
    ["Total TTC", formatMoney(data.totals.totalTTC)],
    ["Net à payer", formatMoney(data.totals.totalTTC)],
  ];
  totals.forEach(([label, value]) => {
    doc.setFont("helvetica", label.includes("TTC") || label.includes("Net") ? "bold" : "normal");
    doc.text(label, totalsX, y);
    doc.text(value, pageWidth - ml, y, { align: "right" });
    y += 5;
  });

  y += 6;
  if (data.paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Conditions de paiement", ml, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(data.paymentTerms, ml, y, { maxWidth: pageWidth - ml * 2 });
    y += 10;
  }
  if (data.observations) {
    doc.setFont("helvetica", "bold");
    doc.text("Observations", ml, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(data.observations, ml, y, { maxWidth: pageWidth - ml * 2 });
    y += 10;
  }

  doc.setFontSize(7);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  data.legalMentions.forEach((m) => {
    doc.text(m, ml, y, { maxWidth: pageWidth - ml * 2 });
    y += 4;
  });

  await applyCompanyFooter(doc, 1);
}
