"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { LoadingState, LoadingButtonContent } from "@/components/ui/loading";

type DeliveryDetail = {
  id: string;
  reference: string;
  status: string;
  sale: { reference: string };
  client: { name: string; phone: string | null };
  vehicle: {
    brand: { label: string };
    carModel: { label: string };
    version: string | null;
    plate: string | null;
  };
  depot: { name: string };
  exitVoucher?: { reference: string } | null;
};

export default function ScanDeliveryNotePage({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = use(params);
  const [data, setData] = useState<DeliveryDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/warehouse/delivery-notes/scan/${qrToken}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Bon de livraison introuvable");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [qrToken]);

  if (loading) return <LoadingState label="Chargement du bon de livraison…" />;
  if (error && !data) {
    return (
      <div className="rounded-xl border border-morocco-500/30 bg-morocco-500/10 p-6 text-sm">
        {error}
        <Link href="/dashboard/warehouse" className="mt-4 block text-gold-700">
          Retour magasin
        </Link>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
        <p className="font-mono text-xs text-navy-500">{data.reference}</p>
        <h2 className="font-display text-2xl text-navy-950">Bon de livraison</h2>
        <p className="mt-2 text-sm text-navy-600">Vente {data.sale.reference}</p>
        <p className="text-sm">
          Client : <strong>{data.client.name}</strong>
        </p>
        <p className="text-sm">Véhicule : {formatVehicleTitle(data.vehicle)}</p>
        <p className="text-sm">Dépôt : {data.depot.name}</p>
        {data.exitVoucher && (
          <p className="text-sm text-navy-600">Bon de sortie : {data.exitVoucher.reference}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/documents/preview/delivery-note/${data.id}`}
          className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          <LoadingButtonContent loading={false}>Prévisualiser le document</LoadingButtonContent>
        </Link>
        <Link href="/dashboard/warehouse" className="btn-sofi-ghost text-sm">
          Tableau de bord magasin
        </Link>
      </div>
    </div>
  );
}
