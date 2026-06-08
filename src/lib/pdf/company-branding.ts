import path from "node:path";
import { readUploadFile } from "@/lib/storage/file-resolver";
import type { jsPDF } from "jspdf";
import { getCompanyProfile } from "@/lib/services/company-profile-service";

type ImageAsset = { dataUrl: string; format: "PNG" | "JPEG" | "WEBP" };

async function loadPublicImage(publicPath: string | null | undefined): Promise<ImageAsset | null> {
  if (!publicPath?.startsWith("/uploads/")) return null;
  try {
    const buf = await readUploadFile(publicPath);
    if (!buf) return null;
    const ext = path.extname(publicPath).toLowerCase();
    if (ext === ".webp" || ext === ".gif" || ext === ".svg") return null;
    const format: ImageAsset["format"] = ext === ".png" ? "PNG" : "JPEG";
    const mime = format === "PNG" ? "image/png" : "image/jpeg";
    return {
      dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
      format,
    };
  } catch {
    return null;
  }
}

function addImageSafe(
  doc: jsPDF,
  asset: ImageAsset,
  x: number,
  y: number,
  w: number,
  h: number
) {
  try {
    doc.addImage(asset.dataUrl, asset.format, x, y, w, h);
  } catch {
    /* format réel incompatible (ex. webp renommé en .jpg) */
  }
}

function splitLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function companyIdentityLines(profile: Awaited<ReturnType<typeof getCompanyProfile>>): string[] {
  const lines: string[] = [];
  const name = profile.tradeName?.trim() || profile.legalName?.trim();
  if (name) lines.push(name);
  if (profile.legalForm) lines.push(profile.legalForm);
  const ids = [
    profile.ice ? `ICE : ${profile.ice}` : null,
    profile.rc ? `RC : ${profile.rc}` : null,
    profile.taxId ? `IF : ${profile.taxId}` : null,
    profile.patent ? `Patente : ${profile.patent}` : null,
  ].filter(Boolean) as string[];
  if (ids.length) lines.push(ids.join(" · "));
  const addr = [profile.address, profile.postalCode, profile.city, profile.country]
    .filter(Boolean)
    .join(", ");
  if (addr) lines.push(addr);
  const contact = [
    profile.phone ? `Tél. ${profile.phone}` : null,
    profile.email ?? null,
    profile.website ?? null,
  ].filter(Boolean) as string[];
  if (contact.length) lines.push(contact.join(" · "));
  return lines;
}

export type PdfBrandingOptions = {
  title?: string;
  subtitle?: string;
  marginLeft?: number;
  marginRight?: number;
};

/** En-tête + logo ; retourne la position Y pour le contenu */
export async function applyCompanyHeader(
  doc: jsPDF,
  options: PdfBrandingOptions = {}
): Promise<number> {
  const profile = await getCompanyProfile();
  const marginLeft = options.marginLeft ?? 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginRight = options.marginRight ?? 14;
  let y = 12;

  const headerImg = await loadPublicImage(profile.headerImageUrl);
  if (headerImg) {
    const imgW = pageWidth - marginLeft - marginRight;
    const imgH = 28;
    addImageSafe(doc, headerImg, marginLeft, y, imgW, imgH);
    y += imgH + 4;
  } else {
    const logo = await loadPublicImage(profile.logoUrl);
    if (logo) {
      addImageSafe(doc, logo, marginLeft, y, 22, 22);
    }
    const textX = logo ? marginLeft + 26 : marginLeft;
    const identity = companyIdentityLines(profile);
    const headerLines = splitLines(profile.headerText);
    const allLines = headerLines.length ? headerLines : identity;

    doc.setTextColor(20);
    doc.setFontSize(11);
    if (allLines[0]) {
      doc.setFont("helvetica", "bold");
      doc.text(allLines[0], textX, y + 5);
      doc.setFont("helvetica", "normal");
    }
    doc.setFontSize(8);
    doc.setTextColor(60);
    allLines.slice(1).forEach((line, i) => {
      doc.text(line, textX, y + 10 + i * 4, { maxWidth: pageWidth - textX - marginRight });
    });
    const textBlockH = Math.max(22, 8 + allLines.length * 4);
    y = Math.max(y + textBlockH, y + 24);
  }

  if (options.title) {
    doc.setTextColor(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(options.title, marginLeft, y);
    y += 7;
  }
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(options.subtitle, marginLeft, y);
    y += 6;
  }

  doc.setTextColor(60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  return y + 2;
}

/** Pied de page sur la page courante */
export async function applyCompanyFooter(doc: jsPDF, pageNumber?: number) {
  const profile = await getCompanyProfile();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  let footerTop = pageHeight - 18;

  const footerImg = await loadPublicImage(profile.footerImageUrl);
  if (footerImg) {
    const imgH = 16;
    footerTop = pageHeight - imgH - 6;
    addImageSafe(doc, footerImg, marginLeft, footerTop, pageWidth - marginLeft - marginRight, imgH);
    footerTop -= 4;
  }

  const footerLines = splitLines(profile.footerText);
  const notes = splitLines(profile.documentNotes);
  const bank = profile.bankAccount
    ? [`${profile.bankName ?? "Banque"} : ${profile.bankAccount}`]
  : [];
  const lines = [...footerLines, ...bank, ...notes].slice(0, 4);

  if (lines.length) {
    doc.setFontSize(7);
    doc.setTextColor(100);
    lines.forEach((line, i) => {
      doc.text(line, marginLeft, footerTop - (lines.length - i) * 3.5, {
        maxWidth: pageWidth - marginLeft - marginRight - 20,
      });
    });
  }

  if (pageNumber != null) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(String(pageNumber), pageWidth - marginRight, pageHeight - 8, { align: "right" });
  }

  doc.setTextColor(60);
  doc.setFontSize(10);
}

/** Logo seul (coin) pour petits documents */
export async function applyCompanyLogo(
  doc: jsPDF,
  x: number,
  y: number,
  size = 20
): Promise<boolean> {
  const profile = await getCompanyProfile();
  const logo = await loadPublicImage(profile.logoUrl);
  if (!logo) return false;
  addImageSafe(doc, logo, x, y, size, size);
  return true;
}

export async function getCompanyDisplayName(): Promise<string> {
  const profile = await getCompanyProfile();
  return profile.tradeName?.trim() || profile.legalName?.trim() || "SOFISMART";
}
