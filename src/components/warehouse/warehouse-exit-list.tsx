"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LoadingState } from "@/components/ui/loading";
import { ExitVoucherStatusBadge } from "@/components/sales/sale-status-badge";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import type { ExitVoucherStatus } from "@/generated/prisma/enums";

type Row = {
  id: string;
  reference: string;
  secureToken: string;
  status: ExitVoucherStatus;
  generatedAt: string;
  sale: { reference: string };
  vehicle: { brand: { label: string }; carModel: { label: string }; version: string | null; plate: string | null };
  depot: { name: string };
};

export function WarehouseExitList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/warehouse/exit-vouchers/pending")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Chargement des bons…" minHeight="min-h-[8rem]" size="sm" />;

  return (
    <section id="list" className="rounded-xl border border-navy-950/10 bg-white shadow-sm">
      <h2 className="border-b border-navy-950/10 px-4 py-3 text-sm font-semibold text-navy-900">
        Bons en attente
      </h2>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-navy-500">Aucun bon en attente</p>
      ) : (
        <ul className="divide-y divide-navy-950/5">
          {rows.map((v) => (
            <li key={v.id}>
              <Link
                href={`/dashboard/warehouse/exit-vouchers/scan/${v.secureToken}`}
                className="block px-4 py-3 hover:bg-cream-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-navy-500">{v.reference}</p>
                    <p className="font-medium text-navy-900">{formatVehicleTitle(v.vehicle)}</p>
                    <p className="text-xs text-navy-600">
                      {v.depot.name} · Vente {v.sale.reference}
                    </p>
                    <p className="text-xs text-navy-400">
                      {format(new Date(v.generatedAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <ExitVoucherStatusBadge status={v.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
