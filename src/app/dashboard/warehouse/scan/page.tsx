"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QrCode } from "lucide-react";
import { LoadingButtonContent } from "@/components/ui/loading";

export default function WarehouseScanPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  function go() {
    const t = token.trim();
    if (!t) return;
    setLoading(true);
    router.push(`/dashboard/warehouse/exit-vouchers/scan/${t}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="font-display text-2xl text-navy-950">Scanner un bon</h2>
        <p className="text-sm text-navy-600">
          Scannez le QR code du bon de sortie ou saisissez le code manuellement.
        </p>
      </div>
      <label className="block text-sm">
        <span className="text-navy-700">Code sécurisé</span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="input-sofi mt-1 w-full font-mono text-sm"
          placeholder="Coller le token ou l'URL complète"
        />
      </label>
      <button
        type="button"
        disabled={loading || !token.trim()}
        onClick={go}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 py-3 text-sm font-semibold text-navy-950 disabled:opacity-50"
      >
        <LoadingButtonContent loading={loading} loadingLabel="Ouverture…">
          <>
            <QrCode className="h-5 w-5" /> Ouvrir le bon
          </>
        </LoadingButtonContent>
      </button>
    </div>
  );
}
