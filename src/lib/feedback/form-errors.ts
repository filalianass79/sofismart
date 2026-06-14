import type { FieldErrors } from "react-hook-form";

const INVALID_ATTR = "data-sofi-invalid";
const INVALID_CLASS = "input-sofi-invalid";

/** Premier message d'erreur dans l'arbre react-hook-form / Zod. */
export function firstFormError(errors: FieldErrors): string | null {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== "object") continue;
    if ("message" in value && typeof value.message === "string") return value.message;
    const nested = firstFormError(value as FieldErrors);
    if (nested) return nested;
  }
  return null;
}

/** Chemins des champs invalides (ex. `newClient.phone`, `vehicleId`). */
export function collectInvalidFieldPaths(errors: FieldErrors, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ("message" in value && value.message) {
      paths.push(path);
    } else {
      paths.push(...collectInvalidFieldPaths(value as FieldErrors, path));
    }
  }
  return paths;
}

function attachClearOnInteraction(el: Element) {
  const clear = () => {
    el.classList.remove(INVALID_CLASS);
    el.removeAttribute(INVALID_ATTR);
    el.removeEventListener("input", clear);
    el.removeEventListener("focus", clear);
    el.removeEventListener("click", clear);
  };
  el.addEventListener("input", clear, { once: true });
  el.addEventListener("focus", clear, { once: true });
  if (el instanceof HTMLButtonElement || el.getAttribute("role") === "button") {
    el.addEventListener("click", clear, { once: true });
  }
}

function findFieldElement(path: string): HTMLElement | null {
  const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(path)}"]`);
  if (byName) return byName;
  const byDataField = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(path)}"]`);
  if (byDataField) return byDataField;
  const byId = document.getElementById(path);
  return byId;
}

/** Retire tous les surlignages d'erreur. */
export function clearInvalidFieldHighlights() {
  document.querySelectorAll(`[${INVALID_ATTR}="true"]`).forEach((el) => {
    el.classList.remove(INVALID_CLASS);
    el.removeAttribute(INVALID_ATTR);
  });
}

/**
 * Surligne les champs manquants (bordure rouge) et place le focus sur le premier.
 */
export function highlightInvalidFormFields(fieldPaths: string[]) {
  clearInvalidFieldHighlights();
  if (!fieldPaths.length) return;

  let firstEl: HTMLElement | null = null;

  for (const path of fieldPaths) {
    const el = findFieldElement(path);
    if (!el) continue;
    el.classList.add(INVALID_CLASS);
    el.setAttribute(INVALID_ATTR, "true");
    attachClearOnInteraction(el);
    if (!firstEl) firstEl = el;
  }

  if (!firstEl) return;

  const focusTarget =
    firstEl.matches("input, select, textarea, button")
      ? firstEl
      : (firstEl.querySelector("input, select, textarea, button") as HTMLElement | null) ?? firstEl;

  focusTarget.focus({ preventScroll: false });
  firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
}
