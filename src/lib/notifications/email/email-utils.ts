import path from "node:path";
import { uploadsRoot } from "@/lib/invoice-import/paths";

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
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return null;
  let relative = fileUrl.replace(/\\/g, "/");
  if (relative.startsWith("/uploads/")) relative = relative.slice("/uploads/".length);
  else if (relative.startsWith("uploads/")) relative = relative.slice("uploads/".length);
  else if (relative.startsWith("public/uploads/")) relative = relative.slice("public/uploads/".length);
  else if (path.isAbsolute(relative)) return relative;
  return path.join(uploadsRoot(), relative);
}
