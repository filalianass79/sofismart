import { readUploadFile, resolveAttachmentPath as resolveUploadPath, uploadsRoot } from "@/lib/storage/file-resolver";

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeEmailList(raw: string[] | undefined): string[] {
  if (!raw?.length) return [];
  return [...new Set(raw.map((e) => e.trim().toLowerCase()).filter(isValidEmail))];
}

/** Résout une URL relative (/uploads/...) vers un chemin disque pour pièces jointes. */
export function resolveAttachmentPath(fileUrl: string): string | null {
  return resolveUploadPath(fileUrl);
}

/** Lit une pièce jointe (local ou S3). */
export async function readAttachmentBuffer(fileUrl: string): Promise<Buffer | null> {
  const local = resolveUploadPath(fileUrl);
  if (local) {
    try {
      const { readFile } = await import("node:fs/promises");
      return await readFile(local);
    } catch {
      return null;
    }
  }
  if (fileUrl.startsWith("/uploads/")) {
    return readUploadFile(fileUrl);
  }
  return null;
}

export { uploadsRoot };
