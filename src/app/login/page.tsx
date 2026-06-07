import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getDefaultRedirectForRole } from "@/lib/auth/default-redirect";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    const roleCode =
      (session.user as { roleCode?: string }).roleCode ??
      (session.user as { role?: string }).role;
    redirect(getDefaultRedirectForRole(roleCode));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(197,160,40,0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(193,39,45,0.15), transparent)",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-navy-950">
            <span>Sofi</span>
            <span className="bg-gradient-to-r from-gold-500 to-gold-300 bg-clip-text text-transparent">Smart</span>
          </h1>
          <p className="mt-2 text-sm text-navy-600">Connexion sécurisée à votre espace de gestion</p>
        </div>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-navy-950/5" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-navy-500">
          {process.env.NEXT_PUBLIC_APP_ENV === "staging" ? (
            <>
              Staging :{" "}
              <span className="font-mono text-navy-800">admin@test.sofismart.ma</span> /{" "}
              <span className="font-mono">Admin123*</span>
              {" · "}
              <a href="/about-test" className="text-gold-800 underline">
                Infos test
              </a>
            </>
          ) : (
            <>
              Compte démo : <span className="font-mono text-navy-800">admin@sofismart.ma</span> /{" "}
              <span className="font-mono">SofiSmart2026!</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
