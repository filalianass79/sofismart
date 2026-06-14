/** Extrait un message lisible depuis une réponse API JSON. */
export function parseApiError(body: unknown, fallback = "Une erreur est survenue"): string {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (typeof record.message === "string") return record.message;
  const err = record.error;
  if (err && typeof err === "object") {
    const nested = err as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
    if ("fieldErrors" in nested) {
      const fieldErrors = nested.fieldErrors as Record<string, string[] | undefined> | undefined;
      if (fieldErrors) {
        const msg = Object.values(fieldErrors).flat().find(Boolean);
        if (msg) return msg;
      }
    }
    const formErrors = (nested as { formErrors?: string[] }).formErrors;
    if (formErrors?.[0]) return formErrors[0];
  }
  return fallback;
}
