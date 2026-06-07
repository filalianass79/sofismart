"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PASSWORD_RULES_MSG } from "@/lib/password";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

export function ChangePasswordForm({ forced = false }: { forced?: boolean }) {
  const router = useRouter();
  const { update } = useSession();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/me/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof j.error === "string" ? j.error : "Erreur");
      return;
    }
    setOk(true);
    await update({ passwordMustChange: false });
    if (forced) router.push("/dashboard");
    else router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="relative mx-auto max-w-md space-y-4 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
      {loading && <LoadingOverlay label="Mise à jour du mot de passe…" />}
      {forced && (
        <p className="rounded-lg bg-gold-500/15 px-3 py-2 text-sm text-navy-800">
          Vous devez changer votre mot de passe avant de continuer.
        </p>
      )}
      <p className="text-xs text-navy-500">{PASSWORD_RULES_MSG}</p>
      {error && <p className="text-sm text-morocco-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">Mot de passe mis à jour.</p>}
      <label className="block text-sm">
        <span className="text-navy-700">Mot de passe actuel</span>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          className="input-sofi mt-1 w-full"
        />
      </label>
      <label className="block text-sm">
        <span className="text-navy-700">Nouveau mot de passe</span>
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          className="input-sofi mt-1 w-full"
        />
      </label>
      <label className="block text-sm">
        <span className="text-navy-700">Confirmation</span>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-sofi mt-1 w-full"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60"
      >
        <LoadingButtonContent loading={loading} loadingLabel="Enregistrement…">
          Enregistrer
        </LoadingButtonContent>
      </button>
      {forced && (
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-sm text-navy-500">
          Déconnexion
        </button>
      )}
    </form>
  );
}
