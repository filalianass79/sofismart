"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Printer, RefreshCw, XCircle } from "lucide-react";
import { isProformaEditable } from "@/lib/proforma-labels";
import type { ProformaStatus } from "@/generated/prisma/enums";

export function ProformaDetailActions({
  id,
  status,
  pdfUrl,
}: {
  id: string;
  status: ProformaStatus;
  pdfUrl: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function act(path: string, method = "POST") {
    setLoading(path);
    const res = await fetch(path, { method });
    setLoading("");
    if (res.ok) {
      router.refresh();
      return true;
    }
    const j = await res.json().catch(() => ({}));
    alert(j.error ?? "Erreur");
    return false;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isProformaEditable(status) && (
        <Link
          href={`/dashboard/proformas/${id}/edit`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Modifier
        </Link>
      )}
      {status === "DRAFT" && (
        <button
          type="button"
          disabled={!!loading}
          onClick={() => act(`/api/proformas/${id}/generate`)}
          className="rounded-lg bg-navy-950 px-3 py-2 text-sm font-semibold text-white"
        >
          Générer PDF
        </button>
      )}
      {pdfUrl && (
        <>
          <Link
            href={`/dashboard/proformas/${id}/preview`}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Prévisualiser
          </Link>
          <Link
            href={`/api/proformas/${id}/download`}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Télécharger
          </Link>
          <Link
            href={`/dashboard/proformas/${id}/print`}
            onClick={() => act(`/api/proformas/${id}/print`)}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Printer className="h-4 w-4" /> Imprimer
          </Link>
        </>
      )}
      {!["CANCELLED", "CONVERTED_TO_SALE"].includes(status) && (
        <>
          <button
            type="button"
            disabled={!!loading}
            onClick={async () => {
              if (!confirm("Transformer cette proforma en vente (brouillon) ?")) return;
              const ok = await act(`/api/proformas/${id}/convert-to-sale`);
              if (ok) {
                const res = await fetch(`/api/proformas/${id}`);
                const j = await res.json();
                if (j.convertedSale?.id) router.push(`/dashboard/sales/${j.convertedSale.id}`);
                else router.push("/dashboard/sales");
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-gold-400 px-3 py-2 text-sm font-medium text-gold-900"
          >
            <RefreshCw className="h-4 w-4" /> Transformer en vente
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={async () => {
              if (!confirm("Annuler cette proforma ?")) return;
              await act(`/api/proformas/${id}/cancel`);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-morocco-300 px-3 py-2 text-sm text-morocco-800"
          >
            <XCircle className="h-4 w-4" /> Annuler
          </button>
        </>
      )}
    </div>
  );
}
