import type { OcrWordBlock } from "./types";

/** Nettoie le texte OCR brut pour améliorer l'extraction IA/regex. */
export function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[|¦]/g, "I")
    .replace(/(\d)[oO](\d)/g, "$1$2")
    .replace(/(\d)[lL](\d)/g, "$1$2")
    .replace(/(\d)\s+([.,])\s+(\d)/g, "$1$2$3")
    .replace(/(\d)\s+(\d{3})/g, "$1$2")
    .trim();
}

/** Détection orientation simplifiée (placeholder — amélioration future avec sharp). */
export function detectDocumentOrientation(_buffer: Buffer): number {
  return 0;
}

/** Amélioration image (pass-through ; brancher sharp plus tard). */
export async function enhanceInvoiceImage(buffer: Buffer): Promise<Buffer> {
  return buffer;
}

/** Extraction texte natif PDF via pdf-parse (délégué à ocr-service). */
export type NativePdfTextResult = {
  text: string;
  pageCount: number;
  isNative: boolean;
};

/** Regroupe les mots OCR en blocs pour contexte IA. */
export function buildOcrBlocks(words: OcrWordBlock[]): { text: string; confidence: number }[] {
  if (!words.length) return [];
  const blocks: { text: string; confidence: number }[] = [];
  let current: OcrWordBlock[] = [];
  let lastY: number | null = null;

  for (const w of words) {
    if (lastY !== null && Math.abs(w.y - lastY) > 15) {
      if (current.length) {
        blocks.push({
          text: current.map((x) => x.text).join(" "),
          confidence: current.reduce((s, x) => s + x.confidence, 0) / current.length,
        });
        current = [];
      }
    }
    current.push(w);
    lastY = w.y;
  }
  if (current.length) {
    blocks.push({
      text: current.map((x) => x.text).join(" "),
      confidence: current.reduce((s, x) => s + x.confidence, 0) / current.length,
    });
  }
  return blocks;
}

export function computeOcrScore(words: OcrWordBlock[], rawText: string): number {
  if (words.length) {
    const avg = words.reduce((s, w) => s + w.confidence, 0) / words.length;
    return Math.min(1, Math.max(0, avg / 100));
  }
  if (rawText.length > 200) return 0.7;
  if (rawText.length > 50) return 0.45;
  return 0.1;
}
