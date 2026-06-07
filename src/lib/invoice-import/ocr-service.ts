import { pathToFileURL } from "node:url";
import { ocrModulePaths } from "./paths";

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

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; pageCount: number }> {
  if (mimeType === "application/pdf") {
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

  if (mimeType.startsWith("image/")) {
    try {
      const { createWorker } = await import("tesseract.js");
      const { tesseractWorker, tesseractCore } = ocrModulePaths();
      const worker = await createWorker("fra+eng", undefined, {
        workerPath: tesseractWorker,
        corePath: tesseractCore,
        workerBlobURL: false,
        logger: () => {},
      });
      try {
        const {
          data: { text },
        } = await worker.recognize(buffer);
        return { text: text ?? "", pageCount: 1 };
      } finally {
        await worker.terminate();
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : "OCR indisponible";
      throw new Error(
        `OCR image impossible (${detail}). Utilisez un PDF ou saisissez manuellement.`,
      );
    }
  }

  throw new Error(`Format non supporté : ${mimeType}`);
}

export { invoiceImportDir } from "./paths";
