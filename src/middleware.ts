import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

const isPublic = (pathname: string) =>
  pathname.startsWith("/login") ||
  pathname.startsWith("/sale-validation") ||
  pathname.startsWith("/health") ||
  pathname.startsWith("/about-test") ||
  pathname.startsWith("/api/health") ||
  pathname.startsWith("/api/auth") ||
  pathname.startsWith("/api/whatsapp/webhook") ||
  pathname.startsWith("/api/sales/validate-from-email") ||
  pathname.startsWith("/api/test/") ||
  pathname.startsWith("/_next") ||
  pathname.startsWith("/favicon.ico") ||
  pathname.startsWith("/demo-documents") ||
  pathname.startsWith("/uploads/") ||
  /\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$/.test(pathname);

const changePasswordPath = "/dashboard/security/change-password";

/** HTTPS derrière Nginx : ne pas s'appuyer uniquement sur les variables build-time. */
function isHttpsRequest(req: NextRequest): boolean {
  if (req.nextUrl.protocol === "https:") return true;
  const forwarded = req.headers.get("x-forwarded-proto");
  return forwarded?.split(",")[0]?.trim() === "https";
}

/**
 * Redirection relative (clone de nextUrl) pour éviter ERR_TOO_MANY_REDIRECTS
 * quand l'app est derrière un reverse proxy SSL (http interne → https public).
 */
function redirectTo(req: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

async function readSessionToken(req: NextRequest): Promise<JWT | null> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const useSecureCookies = isHttpsRequest(req);

  let token = await getToken({
    req,
    secret,
    secureCookie: useSecureCookies,
    cookieName: useSecureCookies
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  // Fallback si cookie non sécurisé encore présent (migration HTTP → HTTPS)
  if (!token && useSecureCookies) {
    token = await getToken({
      req,
      secret,
      secureCookie: false,
      cookieName: "authjs.session-token",
    });
  }

  return token;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = await readSessionToken(req);

  if (!token) {
    return redirectTo(req, "/login", { callbackUrl: pathname });
  }

  if (
    token.passwordMustChange &&
    !pathname.startsWith(changePasswordPath) &&
    !pathname.startsWith("/api/me")
  ) {
    return redirectTo(req, changePasswordPath);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
