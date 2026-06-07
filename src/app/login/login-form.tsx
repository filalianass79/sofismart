"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LoadingButtonContent } from "@/components/ui/loading";
import { resolvePostLoginUrl } from "@/lib/auth/default-redirect";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    const sess = await fetch("/api/auth/session").then((r) => r.json());
    const roleCode = sess?.user?.roleCode as string | undefined;
    window.location.href = resolvePostLoginUrl(callbackUrl, roleCode);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-morocco-500/40 bg-morocco-500/10 px-3 py-2 text-sm text-morocco-600">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-navy-950/15 bg-white px-3 py-2.5 text-sm outline-none ring-gold-400/40 transition focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy-800">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-navy-950/15 bg-white px-3 py-2.5 text-sm outline-none ring-gold-400/40 transition focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 py-2.5 text-sm font-semibold text-navy-950 shadow-md transition hover:brightness-105 disabled:opacity-60"
      >
        <LoadingButtonContent loading={loading} loadingLabel="Connexion…">
          Se connecter
        </LoadingButtonContent>
      </button>
    </form>
  );
}
