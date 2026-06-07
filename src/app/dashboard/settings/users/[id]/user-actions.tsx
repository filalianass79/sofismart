"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingOverlay } from "@/components/ui/loading";

export function UserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function call(path: string, method = "PATCH") {
    setLoading(true);
    const res = await fetch(path, { method });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Action refusée ou erreur");
  }

  async function resetPassword() {
    setLoading(true);
    const res = await fetch(`/api/users/${userId}/reset-password`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      alert("Erreur réinitialisation");
      return;
    }
    const j = await res.json();
    setTempPwd(j.temporaryPassword);
  }

  return (
    <div className="relative flex flex-wrap gap-2">
      {loading && <LoadingOverlay label="Traitement en cours…" className="rounded-lg" />}
      <button
        type="button"
        disabled={loading}
        onClick={() => call(`/api/users/${userId}/activate`)}
        className="rounded-lg border border-emerald-600/30 px-3 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-50"
      >
        Activer
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => call(`/api/users/${userId}/deactivate`)}
        className="rounded-lg border border-navy-950/15 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        Désactiver
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => call(`/api/users/${userId}/block`)}
        className="rounded-lg border border-morocco-600/30 px-3 py-1.5 text-xs font-medium text-morocco-700 disabled:opacity-50"
      >
        Bloquer
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={resetPassword}
        className="rounded-lg bg-gold-500/20 px-3 py-1.5 text-xs font-semibold text-gold-900 disabled:opacity-50"
      >
        Réinitialiser MDP
      </button>
      {tempPwd && (
        <p className="w-full rounded-lg bg-navy-950 p-3 font-mono text-sm text-gold-300">
          Mot de passe temporaire : {tempPwd}
        </p>
      )}
    </div>
  );
}
