"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Mail,
  Minus,
  Plus,
  Printer,
  RefreshCw,
} from "lucide-react";
import { ExitVoucherTemplate } from "./exit-voucher-template";
import { DeliveryNoteTemplate } from "./delivery-note-template";
import { SalesInvoiceTemplate } from "./sales-invoice-template";
import { ProformaPreview } from "@/components/proformas/proforma-preview";
import type { CommercialDocumentData, DocumentPreviewType } from "@/lib/documents/types";
import { pdfDownloadUrl, pdfFileName } from "@/lib/documents/pdf-urls";

type HistoryRow = {
  id: string;
  action: string;
  createdAt: string;
  user?: { name: string | null; email: string } | null;
};

const TYPE_LABELS: Record<DocumentPreviewType, string> = {
  "exit-voucher": "Bon de sortie",
  "delivery-note": "Bon de livraison",
  "sales-invoice": "Facture de vente",
  proforma: "Facture proforma",
};

export function DocumentPreviewClient({
  type,
  data,
  history,
  backHref,
}: {
  type: DocumentPreviewType;
  data: CommercialDocumentData;
  history: HistoryRow[];
  backHref: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"preview" | "info" | "history">("preview");
  const [scale, setScale] = useState(0.85);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const pdfUrl = pdfDownloadUrl(type, data.id);
  const ref =
    data.type === "sales-invoice"
      ? data.invoiceNumber
      : data.reference;

  function printDoc() {
    window.print();
    void fetch(`/api/documents/${type}/${data.id}/printed`, { method: "POST" });
  }

  async function sendDoc() {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/documents/${type}/${data.id}/send`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMessage((j as { error?: string }).error ?? "Envoi impossible");
      return;
    }
    setMessage("Notification envoyée.");
    router.refresh();
  }

  async function regeneratePdf() {
    setBusy(true);
    const res = await fetch(`/api/documents/${type}/${data.id}/generate-pdf`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setMessage("Échec régénération PDF");
      return;
    }
    router.refresh();
  }

  return (
    <div className="document-preview-root min-h-screen bg-cream-100 pb-12">
      <div className="document-preview-toolbar sticky top-0 z-20 border-b border-navy-950/10 bg-white/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={backHref} className="btn-sofi-ghost inline-flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
            <div>
              <p className="text-xs uppercase tracking-wide text-navy-500">{TYPE_LABELS[type]}</p>
              <p className="font-mono font-semibold text-navy-950">{ref}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-sofi-ghost p-2"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              aria-label="Zoom arrière"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xs text-navy-600">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              className="btn-sofi-ghost p-2"
              onClick={() => setScale((s) => Math.min(1.2, s + 0.1))}
              aria-label="Zoom avant"
            >
              <Plus className="h-4 w-4" />
            </button>
            <a
              href={pdfUrl}
              download={pdfFileName(type, ref)}
              className="btn-sofi-ghost inline-flex items-center gap-1 text-sm"
              onClick={() => void fetch(`/api/documents/${type}/${data.id}/downloaded`, { method: "POST" })}
            >
              <Download className="h-4 w-4" /> PDF
            </a>
            <button type="button" onClick={printDoc} className="btn-sofi-ghost inline-flex items-center gap-1 text-sm">
              <Printer className="h-4 w-4" /> Imprimer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendDoc()}
              className="btn-sofi-primary inline-flex items-center gap-1 text-sm"
            >
              <Mail className="h-4 w-4" /> Envoyer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void regeneratePdf()}
              className="btn-sofi-ghost inline-flex items-center gap-1 text-sm"
            >
              <RefreshCw className="h-4 w-4" /> Régénérer
            </button>
          </div>
        </div>
        {message && <p className="mx-auto mt-2 max-w-6xl text-sm text-gold-700">{message}</p>}
        <div className="mx-auto mt-3 flex max-w-6xl gap-2">
          {(["preview", "info", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === t ? "bg-navy-950 text-white" : "bg-navy-950/5 text-navy-700"
              }`}
            >
              {t === "preview" ? "Aperçu" : t === "info" ? "Informations" : "Historique"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6">
        {tab === "preview" && (
          <div className="flex justify-center overflow-auto py-4 print:overflow-visible print:py-0">
            {data.type === "exit-voucher" && <ExitVoucherTemplate data={data} scale={scale} />}
            {data.type === "delivery-note" && <DeliveryNoteTemplate data={data} scale={scale} />}
            {data.type === "sales-invoice" && <SalesInvoiceTemplate data={data} scale={scale} />}
            {data.type === "proforma" && <ProformaPreview data={data} />}
          </div>
        )}
        {tab === "info" && (
          <div className="rounded-xl border border-navy-950/10 bg-white p-6 text-sm shadow-sm">
            <p className="font-semibold text-navy-950">Statut : {data.statusLabel}</p>
            {"saleReference" in data && (
              <p className="mt-2">
                Vente :{" "}
                <Link href={`/dashboard/sales/${data.saleId}`} className="text-gold-700">
                  {data.saleReference}
                </Link>
              </p>
            )}
            {data.pdfUrl && (
              <p className="mt-2 text-navy-600">
                Fichier PDF : <span className="font-mono text-xs">{data.pdfUrl}</span>
              </p>
            )}
          </div>
        )}
        {tab === "history" && (
          <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
            {history.length === 0 ? (
              <p className="text-sm text-navy-500">Aucun événement enregistré.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="border-b border-navy-950/5 pb-2">
                    <span className="font-medium">{h.action}</span>
                    <span className="text-navy-500">
                      {" "}
                      — {new Date(h.createdAt).toLocaleString("fr-FR")}
                      {h.user?.name ? ` · ${h.user.name}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
