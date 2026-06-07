import { randomUUID } from "node:crypto";
import path from "node:path";

export const UPLOAD_MIME = {
  images: ["image/jpeg", "image/png", "image/webp"] as const,
  documents: ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const,
  imagesWithSvg: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const,
};

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

export function getMaxUploadBytes(): number {
  const raw = process.env.MAX_UPLOAD_BYTES;
  const n = raw ? Number(raw) : 10 * 1024 * 1024;
  return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
}

export function assertAllowedMime(
  mime: string | null | undefined,
  allowed: readonly string[]
): void {
  if (!mime) return;
  if (!allowed.includes(mime)) {
    throw new Error(`Type de fichier non autorisé (${mime})`);
  }
}

export function assertFileSize(size: number, maxBytes = getMaxUploadBytes()): void {
  if (size > maxBytes) {
    throw new Error(`Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} Mo)`);
  }
}

/** Nom stocké sécurisé (UUID + extension dérivée du MIME). */
export function secureStoredFilename(
  originalName: string,
  mime: string | null | undefined,
  fallbackExt = ".bin"
): string {
  const extFromMime = mime ? EXT_BY_MIME[mime] : undefined;
  const extFromName = path.extname(originalName).toLowerCase();
  const ext = extFromMime ?? (extFromName && extFromName.length <= 6 ? extFromName : fallbackExt);
  return `${randomUUID()}${ext}`;
}

export function sanitizeOriginalName(name: string): string {
  return path.basename(name).replace(/[^\w.\-àâäéèêëïîôùûüç\s]/gi, "_").slice(0, 200);
}
