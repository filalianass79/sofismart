"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LoadingButtonContent } from "@/components/ui/loading";
import { resolvePostLoginUrl } from "@/lib/auth/default-redirect";
import { useFormFeedback } from "@/hooks/use-form-feedback";
import { highlightInvalidFormFields } from "@/lib/feedback/form-errors";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showError, reportError } = useFormFeedback();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!email.trim()) missing.push("email");
    if (!password) missing.push("password");
    if (missing.length) {
      highlightInvalidFormFields(missing);
      showError("Veuillez renseigner l'email et le mot de passe.", "Champs obligatoires");
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      reportError("Email ou mot de passe incorrect.");
      highlightInvalidFormFields(["email", "password"]);
      return;
    }
    const sess = await fetch("/api/auth/session").then((r) => r.json());
    const roleCode = sess?.user?.roleCode as string | undefined;
    window.location.href = resolvePostLoginUrl(callbackUrl, roleCode);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-sofi w-full"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-sofi w-full"
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
