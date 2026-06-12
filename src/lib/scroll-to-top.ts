/** Remonte en haut de la page (fenêtre principale). */
export function scrollPageToTop(behavior: ScrollBehavior = "smooth") {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior });
}
