"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { ProformaStatusBadge } from "./proforma-status-badge";
import { LoadingState } from "@/components/ui/loading";
import type { ProformaStatus } from "@/generated/prisma/enums";

type Row = {
  id: string;
  reference: string;
  proformaDate: string;
  validityDate: string;
  status: ProformaStatus;
  totalTTC: number;
  client: { name: string } | null;
  vehicle: { brand: { label: string }; carModel: { label: string }; version?: string | null };
  commercial: { name: string | null };
};

export function ProformaTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/proformas?${params}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  if (loading && !rows.length) return <LoadingState label="Chargement des proformas…" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input-sofi min-w-[200px] flex-1 text-sm"
          placeholder="Rechercher réf., client, véhicule…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input-sofi text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="GENERATED">Générée</option>
          <option value="PRINTED">Imprimée</option>
          <option value="CONVERTED_TO_SALE">Convertie</option>
          <option value="EXPIRED">Expirée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <Link
          href="/dashboard/proformas/new"
          className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Nouvelle proforma
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-navy-950/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-cream-50 text-xs uppercase text-navy-500">
            <tr>
              <th className="px-3 py-2">Référence</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Véhicule</th>
              <th className="px-3 py-2">Total TTC</th>
              <th className="px-3 py-2">Commercial</th>
              <th className="px-3 py-2">Validité</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-navy-500">
                  Aucune facture proforma
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-navy-950/5">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.reference}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {format(new Date(r.proformaDate), "dd/MM/yyyy", { locale: fr })}
                  </td>
                  <td className="px-3 py-2">{r.client?.name ?? "Client provisoire"}</td>
                  <td className="max-w-xs truncate px-3 py-2">{formatVehicleTitle(r.vehicle)}</td>
                  <td className="px-3 py-2 font-medium">{formatMoney(r.totalTTC)}</td>
                  <td className="px-3 py-2">{r.commercial.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {format(new Date(r.validityDate), "dd/MM/yyyy", { locale: fr })}
                  </td>
                  <td className="px-3 py-2">
                    <ProformaStatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/proformas/${r.id}`} className="text-gold-800 hover:underline">
                      Voir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
