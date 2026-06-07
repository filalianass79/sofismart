import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const isPublic = (pathname: string) =>
  pathname.startsWith("/login") ||
  pathname.startsWith("/health") ||
  pathname.startsWith("/about-test") ||
  pathname.startsWith("/api/health") ||
  pathname.startsWith("/api/auth") ||
  pathname.startsWith("/api/whatsapp/webhook") ||
  pathname.startsWith("/api/test/") ||
  pathname.startsWith("/_next") ||
  pathname.startsWith("/favicon.ico") ||
  pathname.startsWith("/demo-documents") ||
  /\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$/.test(pathname);

const changePasswordPath = "/dashboard/security/change-password";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token.passwordMustChange && !pathname.startsWith(changePasswordPath) && !pathname.startsWith("/api/me")) {
    return NextResponse.redirect(new URL(changePasswordPath, req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
