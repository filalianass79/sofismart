/** Normalise un chemin public /uploads/... (ignore hoste dev type localhost). */
export function normalizePublicUploadUrl(
  src: string | null | undefined,
): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/uploads/")) return trimmed;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;
  if (trimmed.startsWith("public/uploads/")) return `/${trimmed.slice("public/".length)}`;
  try {
    const url = new URL(trimmed);
    if (url.pathname.startsWith("/uploads/")) return url.pathname;
    if (url.pathname.startsWith("/public/uploads/")) {
      return url.pathname.slice("/public".length);
    }
  } catch {
    /* chemin relatif ou invalide */
  }
  return trimmed;
}

export function isImageUploadPath(path: string | null | undefined, mimeType?: string | null): boolean {
  if (!path) return false;
  if (mimeType?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(path);
}
