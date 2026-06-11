/** Normalise un chemin public /uploads/... (ignore hoste dev type localhost). */
export function normalizePublicUploadUrl(
  src: string | null | undefined,
): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/uploads/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.pathname.startsWith("/uploads/")) return url.pathname;
  } catch {
    /* chemin relatif ou invalide */
  }
  return trimmed;
}
