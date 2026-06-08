import { readFile } from "node:fs/promises";
import path from "node:path";
import { readFromS3 } from "./s3-storage-provider";

/** Racine locale des uploads. */
export function uploadsRoot(): string {
  const dir = process.env.UPLOAD_DIR ?? "public/uploads";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

/**
 * Résout un chemin public (/uploads/...) vers le chemin disque local.
 * Retourne null si le fichier est sur S3.
 */
export function resolveLocalUploadPath(publicPath: string): string | null {
  if (!publicPath?.startsWith("/uploads/")) return null;
  if (process.env.UPLOAD_STORAGE === "s3") return null;
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

/** Lit le contenu d'un fichier uploadé (local ou S3). */
export async function readUploadFile(publicPath: string): Promise<Buffer | null> {
  if (!publicPath) return null;

  if (process.env.UPLOAD_STORAGE === "s3") {
    return readFromS3(publicPath);
  }

  const local = resolveLocalUploadPath(publicPath);
  if (!local) return null;
  try {
    return await readFile(local);
  } catch {
    return null;
  }
}

/** Résout fileUrl (/uploads/...) vers un chemin disque pour pièces jointes email. */
export function resolveAttachmentPath(fileUrl: string): string | null {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return null;
  if (process.env.UPLOAD_STORAGE === "s3") return null;

  let relative = fileUrl.replace(/\\/g, "/");
  if (relative.startsWith("/uploads/")) relative = relative.slice("/uploads/".length);
  else if (relative.startsWith("uploads/")) relative = relative.slice("uploads/".length);
  else if (relative.startsWith("public/uploads/")) relative = relative.slice("public/uploads/".length);
  else if (path.isAbsolute(relative)) return relative;
  return path.join(uploadsRoot(), relative);
}
