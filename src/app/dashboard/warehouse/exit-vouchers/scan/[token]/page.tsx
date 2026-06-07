"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { ExitVoucherStatusBadge } from "@/components/sales/sale-status-badge";
import { LoadingState, LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";
import type { ExitVoucherStatus } from "@/generated/prisma/enums";

type VoucherDetail = {
  id: string;
  reference: string;
  status: ExitVoucherStatus;
  message: string | null;
  sale: {
    reference: string;
    finalPrice: number;
    client: { name: string; phone: string | null; cin: string | null; ice: string | null } | null;
    commercial: { name: string | null } | null;
  };
  vehicle: {
    brand: { label: string };
    carModel: { label: string };
    version: string | null;
    plate: string | null;
    vin: string | null;
    color: string | null;
  };
  depot: { name: string };
};

export default function ScanVoucherPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<VoucherDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/exit-vouchers/token/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Bon introuvable");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function confirm() {
    if (!data) return;
    setConfirming(true);
    const res = await fetch(`/api/warehouse/exit-vouchers/${data.id}/confirm-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryNotes: notes || undefined }),
    });
    setConfirming(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Erreur");
      return;
    }
    setDone(true);
  }

  if (loading) return <LoadingState label="Chargement du bon…" />;
  if (error && !data) {
    return (
      <div className="rounded-xl border border-morocco-500/30 bg-morocco-500/10 p-6 text-sm text-morocco-800">
        {error}
        <Link href="/dashboard/warehouse/scan" className="mt-4 block text-gold-700">
          Retour
        </Link>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="relative mx-auto max-w-lg space-y-4">
      {confirming && <LoadingOverlay label="Confirmation livraison…" />}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-navy-950">{data.reference}</h2>
        <ExitVoucherStatusBadge status={data.status} />
      </div>
      {data.message && <p className="text-sm text-navy-600">{data.message}</p>}
      <dl className="space-y-2 rounded-xl border border-navy-950/10 bg-white p-4 text-sm">
        <div>
          <dt className="text-navy-500">Client</dt>
          <dd className="font-medium">{data.sale.client?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-navy-500">Véhicule</dt>
          <dd>{formatVehicleTitle(data.vehicle)}</dd>
        </div>
        <div>
          <dt className="text-navy-500">Dépôt</dt>
          <dd>{data.depot.name}</dd>
        </div>
        <div>
          <dt className="text-navy-500">Vente</dt>
          <dd>{data.sale.reference}</dd>
        </div>
      </dl>
      {done ? (
        <p className="rounded-lg bg-emerald-100 p-4 text-sm text-emerald-800">Livraison confirmée.</p>
      ) : data.status === "PENDING" ? (
        <>
          <label className="block text-sm">
            <span className="text-navy-700">Observations</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input-sofi mt-1 w-full"
            />
          </label>
          <button
            type="button"
            disabled={confirming}
            onClick={confirm}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <LoadingButtonContent loading={confirming} loadingLabel="Confirmation…">
              Confirmer livraison
            </LoadingButtonContent>
          </button>
        </>
      ) : (
        <p className="text-sm text-navy-600">Ce bon n&apos;est plus en attente.</p>
      )}
      <a
        href={`/api/exit-vouchers/${data.id}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="block text-center text-sm text-gold-700"
      >
        Télécharger PDF
      </a>
    </div>
  );
}
