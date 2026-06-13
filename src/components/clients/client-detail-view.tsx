"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  clientDocumentTypeLabels,
  clientTypeLabels,
  interactionTypeLabels,
} from "@/lib/client-labels";
import { formatMoney } from "@/lib/utils";
import { FinancialStatusBadge } from "./financial-status-badge";
import { RelationshipStatusBadge } from "./relationship-status-badge";
import { UploadImageThumb } from "@/components/ui/upload-image-thumb";
import { normalizePublicUploadUrl } from "@/lib/storage/public-upload-url";
import type {
  ClientDocumentType,
  ClientType,
  FinancialStatus,
  InteractionType,
  RelationshipStatus,
} from "@/generated/prisma/enums";

type ClientDetail = {
  id: string;
  reference: string;
  type: ClientType;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  financialStatus: FinancialStatus;
  relationshipStatus: RelationshipStatus;
  notes: string | null;
  isArchived: boolean;
  creditLimit: unknown;
  stats: {
    totalSales: number;
    totalPaid: number;
    outstandingAmount: number;
    vehiclesCount: number;
    totalMargin: number;
    lastSaleDate: string | null;
    paymentStatusLabel: string;
  };
  sales: {
    id: string;
    saleDate: string;
    price: unknown;
    discount: unknown;
    paymentStatus: string;
    vehicle: {
      internalRef: string;
      brand: { label: string };
      carModel: { label: string };
    };
    payments: { amount: unknown; paidAt: string; method: string }[];
  }[];
  clientDocuments: {
    id: string;
    type: ClientDocumentType;
    title: string | null;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }[];
  interactions: {
    id: string;
    type: InteractionType;
    date: string;
    summary: string;
    employee?: { name: string | null };
  }[];
};

const tabs = [
  { id: "info", label: "Informations" },
  { id: "sales", label: "Achats" },
  { id: "payments", label: "Paiements" },
  { id: "documents", label: "Documents" },
  { id: "crm", label: "Notes & suivi" },
  { id: "stats", label: "Statistiques" },
] as const;

export function ClientDetailView({
  client,
  canViewFinancials = false,
}: {
  client: ClientDetail;
  canViewFinancials?: boolean;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("info");
  const [note, setNote] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<ClientDocumentType>("OTHER");

  async function addInteraction() {
    if (!note.trim()) return;
    await fetch(`/api/clients/${client.id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOTE", date: new Date().toISOString(), summary: note }),
    });
    setNote("");
    window.location.reload();
  }

  async function uploadDoc() {
    if (!docFile) return;
    const fd = new FormData();
    fd.append("file", docFile);
    fd.append("type", docType);
    await fetch(`/api/clients/${client.id}/documents`, { method: "POST", body: fd });
    window.location.reload();
  }

  async function archive() {
    if (!confirm("Archiver ce client ?")) return;
    await fetch(`/api/clients/${client.id}/archive`, { method: "PATCH" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-gold-700">{client.reference}</p>
          <h2 className="font-display text-3xl text-navy-950">{client.name}</h2>
          <p className="text-navy-600">{clientTypeLabels[client.type]}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <FinancialStatusBadge status={client.financialStatus} />
            <RelationshipStatusBadge status={client.relationshipStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/clients/${client.id}/edit`} className="rounded-lg border border-navy-950/15 px-4 py-2 text-sm font-medium">
            Modifier
          </Link>
          {!client.isArchived && (
            <button type="button" onClick={archive} className="rounded-lg border border-morocco-600/30 px-4 py-2 text-sm text-morocco-700">
              Archiver
            </button>
          )}
        </div>
      </div>

      <div className={`grid gap-3 ${canViewFinancials ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {[
          { label: "CA total", value: formatMoney(client.stats.totalSales) },
          { label: "Solde", value: formatMoney(client.stats.outstandingAmount) },
          { label: "Véhicules", value: String(client.stats.vehiclesCount) },
          ...(canViewFinancials
            ? [{ label: "Marge", value: formatMoney(client.stats.totalMargin) }]
            : []),
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-navy-500">{k.label}</p>
            <p className="mt-1 font-display text-xl text-navy-950">{k.value}</p>
          </div>
        ))}
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-navy-950/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id ? "border-b-2 border-gold-500 text-gold-800" : "text-navy-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "info" && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-navy-500">Téléphone</dt>
              <dd>{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Email</dt>
              <dd>{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Ville</dt>
              <dd>{client.city ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Paiement</dt>
              <dd>{client.stats.paymentStatusLabel}</dd>
            </div>
          </dl>
          {client.notes && <p className="mt-4 text-navy-700">{client.notes}</p>}
        </section>
      )}

      {tab === "sales" && (
        <section className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs uppercase text-navy-600">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Véhicule</th>
                <th className="px-4 py-2 text-right">Montant</th>
                <th className="px-4 py-2">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {client.sales.map((s) => (
                <tr key={s.id} className="border-t border-navy-950/5">
                  <td className="px-4 py-2">{format(new Date(s.saleDate), "dd/MM/yyyy", { locale: fr })}</td>
                  <td className="px-4 py-2">
                    {s.vehicle.brand.label} {s.vehicle.carModel.label}
                    <span className="ml-1 text-xs text-navy-500">{s.vehicle.internalRef}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatMoney(Number(s.price) - Number(s.discount))}
                  </td>
                  <td className="px-4 py-2">{s.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "payments" && (
        <section className="space-y-2 rounded-xl border border-navy-950/10 bg-white p-5 text-sm">
          <p>
            Payé : <strong>{formatMoney(client.stats.totalPaid)}</strong> — Reste :{" "}
            <strong className="text-morocco-600">{formatMoney(client.stats.outstandingAmount)}</strong>
          </p>
          {client.sales.flatMap((s) =>
            s.payments.map((p) => (
              <div key={`${s.id}-${p.paidAt}`} className="flex justify-between border-t border-navy-950/5 py-2">
                <span>{format(new Date(p.paidAt), "dd/MM/yyyy", { locale: fr })} — {p.method}</span>
                <span className="tabular-nums">{formatMoney(Number(p.amount))}</span>
              </div>
            ))
          )}
        </section>
      )}

      {tab === "documents" && (
        <section className="space-y-4 rounded-xl border border-navy-950/10 bg-white p-5">
          <div className="flex flex-wrap gap-2">
            <select value={docType} onChange={(e) => setDocType(e.target.value as ClientDocumentType)} className="input-sofi">
              {Object.entries(clientDocumentTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={uploadDoc} className="rounded-lg bg-gold-500/20 px-3 py-1 text-sm font-medium">
              Upload
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {client.clientDocuments.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-cream-50 px-3 py-2">
                <span className="flex min-w-0 items-center gap-3">
                  <UploadImageThumb src={d.fileUrl} name={d.fileName} />
                  <span className="min-w-0 truncate">
                    {clientDocumentTypeLabels[d.type]} — {d.title ?? d.fileName}
                  </span>
                </span>
                <a
                  href={normalizePublicUploadUrl(d.fileUrl) ?? d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-gold-700 hover:underline"
                >
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "crm" && (
        <section className="space-y-4 rounded-xl border border-navy-950/10 bg-white p-5">
          <div className="flex gap-2">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input-sofi flex-1" placeholder="Nouvelle note…" />
            <button type="button" onClick={addInteraction} className="rounded-lg bg-gold-500/20 px-4 text-sm font-medium">
              Ajouter
            </button>
          </div>
          <ul className="space-y-3">
            {client.interactions.map((i) => (
              <li key={i.id} className="border-l-2 border-gold-400 pl-3 text-sm">
                <p className="text-xs text-navy-500">
                  {format(new Date(i.date), "dd/MM/yyyy HH:mm", { locale: fr })} — {interactionTypeLabels[i.type]}
                  {i.employee?.name ? ` · ${i.employee.name}` : ""}
                </p>
                <p className="text-navy-800">{i.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "stats" && (
        <section className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl bg-cream-50 p-4">
            <p className="text-navy-500">Fréquence</p>
            <p className="text-lg font-semibold">{client.stats.vehiclesCount} achat(s)</p>
          </div>
          <div className="rounded-xl bg-cream-50 p-4">
            <p className="text-navy-500">Dernier achat</p>
            <p className="text-lg font-semibold">
              {client.stats.lastSaleDate
                ? format(new Date(client.stats.lastSaleDate), "dd MMM yyyy", { locale: fr })
                : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-cream-50 p-4">
            <p className="text-navy-500">Plafond crédit</p>
            <p className="text-lg font-semibold">
              {client.creditLimit ? formatMoney(Number(client.creditLimit)) : "Non défini"}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
