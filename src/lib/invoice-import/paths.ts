import path from "node:path";
import { uploadsRoot } from "@/lib/storage/file-resolver";

export function invoiceImportDir(): string {
  return path.join(uploadsRoot(), "invoice-imports");
}

export function invoiceImportPublicUrl(storedFilename: string): string {
  return `/uploads/invoice-imports/${storedFilename}`;
}

/** Résout fileUrl (/uploads/invoice-imports/xxx.pdf) vers le chemin disque. */
export function resolveInvoiceImportFilePath(fileUrl: string): string {
  const stored = path.basename(fileUrl);
  return path.join(invoiceImportDir(), stored);
}

export function ocrModulePaths() {
  const cwd = process.cwd();
  return {
    pdfWorker: path.join(cwd, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
    tesseractWorker: path.join(
      cwd,
      "node_modules",
      "tesseract.js",
      "src",
      "worker-script",
      "node",
      "index.js",
    ),
    tesseractCore: path.join(cwd, "node_modules", "tesseract.js-core"),
  };
}
