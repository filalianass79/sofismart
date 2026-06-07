"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

const categories = [
  "PURCHASE_INVOICE",
  "SALE_INVOICE",
  "REGISTRATION_CARD",
  "CONTRACT",
  "CUSTOMS",
  "OTHER",
];

export function DocumentUpload() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setStatus(j.error ?? "Échec envoi");
      return;
    }
    setStatus("Fichier enregistré.");
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm"
    >
      {loading && <LoadingOverlay label="Envoi du fichier…" />}
      <h3 className="text-sm font-semibold text-navy-900">Envoyer un fichier</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        <input type="file" name="file" required className="text-sm" disabled={loading} />
        <select name="category" className="input-sofi" disabled={loading}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <LoadingButtonContent loading={loading} loadingLabel="Envoi…">
            Upload
          </LoadingButtonContent>
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-navy-700">{status}</p>}
    </form>
  );
}
