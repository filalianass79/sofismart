"use client";

import { useCallback, useEffect, useState } from "react";
import { UploadImage } from "@/components/ui/upload-image";
import Link from "next/link";
import {
  Package,
  Truck,
  Calendar,
  FileCheck,
  Upload,
  Search,
  QrCode,
  FileText,
} from "lucide-react";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import { ConfirmDeliveryModal } from "./confirm-delivery-modal";
import { formatMoney } from "@/lib/utils";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";

type Stats = {
  vehiclesInDepot: number;
  pendingDeliveries: number;
  deliveredToday: number;
  deliveredWeek: number;
  deliveredMonth: number;
  pendingSigned: number;
  signedUploaded: number;
};

type PendingSale = {
  id: string;
  reference: string;
  saleDate: string;
  deliveryStatus: string;
  client: { name: string; phone: string | null } | null;
  vehicle: {
    plate: string | null;
    vin: string | null;
    brand: { label: string };
    carModel: { label: string };
  };
  commercial: { name: string | null } | null;
  exitVoucher: { id: string; reference: string; secureToken: string } | null;
  deliveryNote: {
    id: string;
    reference: string;
    status: string;
    pdfUrl: string | null;
    qrToken: string;
  } | null;
};

type VehicleRow = {
  id: string;
  internalRef: string;
  year: number;
  mileage: number;
  status: string;
  origin: string;
  targetSalePrice: number | null;
  plate: string | null;
  vin: string | null;
  version: string | null;
  brand: { label: string };
  carModel: { label: string };
  photos: { path: string }[];
  createdAt: string;
};

type HistoryRow = {
  id: string;
  reference: string;
  deliveredAt: string | null;
  status: string;
  signedDocumentUrl: string | null;
  sale: { reference: string };
  client: { name: string };
  vehicle: { plate: string | null; brand: { label: string }; carModel: { label: string } };
  deliveredBy: { name: string | null } | null;
  documents: { fileUrl: string }[];
};

export function WarehouseDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingSale[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [history, setHistory] = useState<{ rows: HistoryRow[]; count: number; avgDelayHours: number | null } | null>(
    null
  );
  const [depot, setDepot] = useState<{ name: string; city: string | null } | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const [search, setSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "vehicles" | "history">("pending");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = search ? `&q=${encodeURIComponent(search)}` : "";
    const vq = vehicleSearch ? `&vehicleQ=${encodeURIComponent(vehicleSearch)}` : "";
    const res = await fetch(`/api/warehouse/dashboard?period=${period}${q}${vq}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setPending(data.pending);
      setVehicles(data.vehicles);
      setHistory(data.history);
      setDepot(data.depot);
    }
    setLoading(false);
  }, [period, search, vehicleSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateDeliveryNote(saleId: string) {
    const res = await fetch(`/api/warehouse/sales/${saleId}/delivery-note/generate`, { method: "POST" });
    if (res.ok) void load();
    else {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Erreur génération");
    }
  }

  const statCards = stats
    ? [
        { label: "Véhicules au dépôt", value: stats.vehiclesInDepot, icon: Package },
        { label: "Livraisons en attente", value: stats.pendingDeliveries, icon: Truck },
        { label: "Livrées aujourd'hui", value: stats.deliveredToday, icon: Calendar },
        { label: "Cette semaine", value: stats.deliveredWeek, icon: Calendar },
        { label: "Ce mois", value: stats.deliveredMonth, icon: Calendar },
        { label: "Bons signés en attente", value: stats.pendingSigned, icon: Upload },
        { label: "Bons signés uploadés", value: stats.signedUploaded, icon: FileCheck },
      ]
    : [];

  return (
    <div className="space-y-6">
      {depot && (
        <p className="text-sm text-navy-600">
          Dépôt : <strong>{depot.name}</strong>
          {depot.city ? ` — ${depot.city}` : ""}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-navy-950/10 bg-white p-3 shadow-sm">
            <c.icon className="h-4 w-4 text-gold-600" />
            <p className="mt-1 text-2xl font-semibold text-navy-950">{c.value}</p>
            <p className="text-xs text-navy-600">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-navy-950/10 pb-2">
        {(["pending", "vehicles", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t ? "bg-gold-500/20 text-navy-950" : "text-navy-600 hover:bg-navy-950/5"
            }`}
          >
            {t === "pending" ? "Livraisons en attente" : t === "vehicles" ? "Véhicules" : "Historique"}
          </button>
        ))}
        <Link href="/dashboard/warehouse/scan" className="ml-auto flex items-center gap-1 text-sm text-gold-700">
          <QrCode className="h-4 w-4" /> Scanner QR
        </Link>
      </div>

      {tab === "pending" && (
        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
            <input
              type="search"
              placeholder="Client, tél., immat., châssis, réf. vente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => void load()}
              className="input-sofi w-full pl-9"
            />
          </div>
          {loading ? (
            <p className="text-sm text-navy-500">Chargement…</p>
          ) : pending.length === 0 ? (
            <p className="rounded-xl border border-dashed border-navy-950/15 p-8 text-center text-sm text-navy-500">
              Aucune livraison en attente pour votre dépôt.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-navy-950/10 bg-white">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b bg-cream-50 text-xs uppercase text-navy-600">
                  <tr>
                    <th className="p-3">Vente</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Véhicule</th>
                    <th className="p-3">Commercial</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s) => (
                    <tr key={s.id} className="border-b border-navy-950/5">
                      <td className="p-3">
                        <div className="font-medium">{s.reference}</div>
                        <div className="text-xs text-navy-500">
                          {new Date(s.saleDate).toLocaleDateString("fr-FR")}
                        </div>
                      </td>
                      <td className="p-3">
                        {s.client?.name ?? "—"}
                        <br />
                        <span className="text-xs text-navy-500">{s.client?.phone ?? ""}</span>
                      </td>
                      <td className="p-3">
                        {formatVehicleTitle(s.vehicle as never)}
                        <br />
                        <span className="text-xs">{s.vehicle.plate ?? s.vehicle.vin ?? ""}</span>
                      </td>
                      <td className="p-3">{s.commercial?.name ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {!s.deliveryNote ? (
                            <button
                              type="button"
                              onClick={() => void generateDeliveryNote(s.id)}
                              className="rounded bg-gold-500/20 px-2 py-1 text-xs font-medium text-navy-900"
                            >
                              Bon livraison
                            </button>
                          ) : (
                            <>
                              <a
                                href={`/api/warehouse/delivery-notes/${s.deliveryNote.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded bg-navy-950/5 px-2 py-1 text-xs"
                              >
                                PDF livraison
                              </a>
                              <button
                                type="button"
                                onClick={() => setConfirmId(s.deliveryNote!.id)}
                                className="rounded bg-emerald-600/15 px-2 py-1 text-xs text-emerald-900"
                              >
                                Confirmer
                              </button>
                            </>
                          )}
                          {s.exitVoucher && (
                            <>
                              <a
                                href={`/api/exit-vouchers/${s.exitVoucher.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded bg-navy-950/5 px-2 py-1 text-xs"
                              >
                                Bon sortie
                              </a>
                              <Link
                                href={`/dashboard/warehouse/exit-vouchers/scan/${s.exitVoucher.secureToken}`}
                                className="rounded bg-navy-950/5 px-2 py-1 text-xs"
                              >
                                QR sortie
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "vehicles" && (
        <section className="space-y-3">
          <input
            type="search"
            placeholder="Immatriculation ou châssis…"
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            onBlur={() => void load()}
            className="input-sofi w-full"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <article
                key={v.id}
                className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm"
              >
                <div className="relative aspect-video bg-navy-950/5">
                  {v.photos[0]?.path ? (
                    <UploadImage src={v.photos[0].path} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-navy-400">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-navy-950">{formatVehicleTitle(v as never)}</h3>
                    <VehicleStatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-navy-600">
                    {v.year} · {v.mileage.toLocaleString("fr-FR")} km · {v.internalRef}
                  </p>
                  <p className="text-xs">{v.plate ?? v.vin ?? "—"}</p>
                  {v.targetSalePrice != null && (
                    <p className="text-sm font-medium text-gold-800">{formatMoney(v.targetSalePrice)}</p>
                  )}
                  <Link href={`/dashboard/vehicles/${v.id}`} className="text-xs text-gold-700">
                    Voir détail →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {(["day", "week", "month"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1 text-sm ${
                  period === p ? "bg-gold-500/20" : "bg-white border border-navy-950/10"
                }`}
              >
                {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
            {history?.avgDelayHours != null && (
              <span className="text-xs text-navy-600">
                Délai moyen vente → livraison : {history.avgDelayHours} h
              </span>
            )}
          </div>
          <div className="space-y-2">
            {history?.rows.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-navy-950/10 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {h.reference} — {h.client.name}
                  </p>
                  <p className="text-xs text-navy-600">
                    {h.deliveredAt ? new Date(h.deliveredAt).toLocaleString("fr-FR") : "—"} ·{" "}
                    {formatVehicleTitle(h.vehicle as never)} {h.vehicle.plate ? `(${h.vehicle.plate})` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/warehouse/delivery-notes/${h.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gold-700 flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" /> BL
                  </a>
                  {(h.signedDocumentUrl || h.documents[0]?.fileUrl) && (
                    <a
                      href={h.signedDocumentUrl ?? h.documents[0]!.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700"
                    >
                      Bon signé
                    </a>
                  )}
                </div>
              </div>
            ))}
            {!history?.rows.length && (
              <p className="text-center text-sm text-navy-500 py-8">Aucune livraison sur cette période.</p>
            )}
          </div>
        </section>
      )}

      {confirmId && (
        <ConfirmDeliveryModal
          deliveryNoteId={confirmId}
          open
          onClose={() => setConfirmId(null)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  );
}


