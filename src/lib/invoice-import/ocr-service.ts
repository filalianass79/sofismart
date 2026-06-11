import { pathToFileURL } from "node:url";
import { ocrModulePaths } from "./paths";
import {
  buildOcrBlocks,
  cleanOcrText,
  computeOcrScore,
  enhanceInvoiceImage,
} from "./ocr-preprocessing-service";
import type { OcrResult, OcrWordBlock } from "./types";

const INVOICE_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

let pdfWorkerConfigured = false;

async function loadPdfParse() {
  const { PDFParse } = await import("pdf-parse");
  if (!pdfWorkerConfigured) {
    const { pdfWorker } = ocrModulePaths();
    PDFParse.setWorker(pathToFileURL(pdfWorker).href);
    pdfWorkerConfigured = true;
  }
  return PDFParse;
}

export function isInvoiceImportMime(mime: string): boolean {
  return (INVOICE_MIME as readonly string[]).includes(mime);
}

export async function extractNativePdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const PDFParse = await loadPdfParse();
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pageCount = result.pages?.length ?? 1;
    return { text: result.text ?? "", pageCount };
  } finally {
    await parser.destroy();
  }
}

async function runTesseractOcr(buffer: Buffer): Promise<{ text: string; words: OcrWordBlock[] }> {
  const { createWorker } = await import("tesseract.js");
  const { tesseractWorker, tesseractCore } = ocrModulePaths();
  const enhanced = await enhanceInvoiceImage(buffer);
  const worker = await createWorker("fra+eng", undefined, {
    workerPath: tesseractWorker,
    corePath: tesseractCore,
    workerBlobURL: false,
    logger: () => {},
  });
  try {
    const result = await worker.recognize(enhanced);
    const words: OcrWordBlock[] = [];
    const data = result.data as {
      blocks?: Array<{
        paragraphs?: Array<{
          lines?: Array<{
            words?: Array<{
              text?: string;
              confidence?: number;
              bbox?: { x0: number; y0: number; x1: number; y1: number };
            }>;
          }>;
        }>;
      }>;
    };
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          for (const w of line.words ?? []) {
            if (!w.text?.trim() || !w.bbox) continue;
            words.push({
              text: w.text,
              confidence: w.confidence ?? 0,
              x: w.bbox.x0,
              y: w.bbox.y0,
              width: w.bbox.x1 - w.bbox.x0,
              height: w.bbox.y1 - w.bbox.y0,
            });
          }
        }
      }
    }
    return { text: result.data.text ?? "", words };
  } finally {
    await worker.terminate();
  }
}

/** Pipeline OCR complet avec texte nettoyé et métadonnées. */
export async function runOCR(buffer: Buffer, mimeType: string): Promise<OcrResult> {
  let rawText = "";
  let pageCount = 1;
  let words: OcrWordBlock[] = [];

  if (mimeType === "application/pdf") {
    const native = await extractNativePdfText(buffer);
    rawText = native.text;
    pageCount = native.pageCount;
    if (rawText.trim().length < 40) {
      try {
        const ocr = await runTesseractOcr(buffer);
        if (ocr.text.length > rawText.length) {
          rawText = ocr.text;
          words = ocr.words;
        }
      } catch {
        /* PDF scanné sans OCR image — conserver texte natif vide */
      }
    }
  } else if (mimeType.startsWith("image/")) {
    const ocr = await runTesseractOcr(buffer);
    rawText = ocr.text;
    words = ocr.words;
    pageCount = 1;
  } else {
    throw new Error(`Format non supporté : ${mimeType}`);
  }

  const cleanedText = cleanOcrText(rawText);
  const blocks = buildOcrBlocks(words);
  const ocrScore = computeOcrScore(words, rawText);

  return {
    rawText,
    cleanedText,
    pageCount,
    words,
    blocks,
    ocrScore,
    ocrJson: {
      pageCount,
      ocrScore,
      wordCount: words.length,
      blockCount: blocks.length,
      textLength: rawText.length,
    },
  };
}

/** Compatibilité ascendante */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; pageCount: number }> {
  const result = await runOCR(buffer, mimeType);
  return { text: result.cleanedText || result.rawText, pageCount: result.pageCount };
}

export { invoiceImportDir } from "./paths";
