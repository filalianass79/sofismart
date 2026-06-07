/** URL par défaut après connexion selon le rôle applicatif. */
export function getDefaultRedirectForRole(roleCode?: string | null): string {
  switch (roleCode) {
    case "MAGASINIER":
      return "/dashboard";
    case "COMMERCIAL":
      return "/dashboard";
    case "ADMIN":
    case "GERANT":
    case "DIRECTEUR":
    case "RESPONSABLE_DEPOT":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export function resolvePostLoginUrl(callbackUrl: string, roleCode?: string | null): string {
  if (callbackUrl && callbackUrl !== "/dashboard" && !callbackUrl.startsWith("/login")) {
    return callbackUrl;
  }
  return getDefaultRedirectForRole(roleCode);
}
