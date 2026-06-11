"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadImage } from "@/components/ui/upload-image";
import { Car } from "lucide-react";
import { LoadingState } from "@/components/ui/loading";
import { ListFilterToolbar, FilterField, countActiveFilters } from "@/components/ui/list-filters";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { vehicleOriginLabels } from "@/lib/purchase-labels";
import type { VehicleOrigin } from "@/generated/prisma/enums";
import type { SaleWizardValues } from "@/lib/validations/sale";

type VehicleHit = {
  id: string;
  internalRef: string;
  brand: { id: string; label: string };
  carModel: { id: string; label: string };
  version: string | null;
  year: number;
  mileage: number;
  color: string | null;
  plate: string | null;
  vin: string | null;
  origin: string;
  status: string;
  costPrice: number;
  targetSalePrice: number | null;
  depot: { id: string; name: string };
  mainPhoto: string | null;
};

const initialFilters = { brandId: "", depotId: "", origin: "" };

export function SaleVehicleStep({ onVehicleSelected }: { onVehicleSelected: () => void }) {
  const { watch, setValue, formState: { errors } } = useFormContext<SaleWizardValues>();
  const vehicleId = watch("vehicleId");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [hits, setHits] = useState<VehicleHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; label: string }[]>([]);
  const [depots, setDepots] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/brands").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/depots").then((r) => (r.ok ? r.json() : [])),
    ]).then(([b, d]) => {
      setBrands(b);
      setDepots(d.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ availableOnly: "true" });
    if (search.trim()) params.set("q", search.trim());
    if (filters.brandId) params.set("brandId", filters.brandId);
    if (filters.depotId) params.set("depotId", filters.depotId);
    if (filters.origin) params.set("origin", filters.origin);
    const res = await fetch(`/api/vehicles/search-available?${params}`);
    if (res.ok) setHits(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const activeFilterCount = countActiveFilters(filters);

  function selectVehicle(v: VehicleHit) {
    setValue("vehicleId", v.id);
    if (v.targetSalePrice) setValue("price", v.targetSalePrice);
    onVehicleSelected();
  }

  const vehicleErrors = errors as { vehicleId?: { message?: string } };

  return (
    <section className="space-y-5 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
      <header>
        <h3 className="font-display text-xl text-navy-950">Véhicule</h3>
        <p className="mt-1 text-sm text-navy-500">
          Véhicules disponibles — cliquez sur une carte pour passer aux conditions de vente.
        </p>
      </header>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Marque, modèle, immat., châssis, réf…"
        activeFiltersCount={activeFilterCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Marque">
          <select
            value={filters.brandId}
            onChange={(e) => setFilters((f) => ({ ...f, brandId: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes marques</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Dépôt">
          <select
            value={filters.depotId}
            onChange={(e) => setFilters((f) => ({ ...f, depotId: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous dépôts</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Origine">
          <select
            value={filters.origin}
            onChange={(e) => setFilters((f) => ({ ...f, origin: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes origines</option>
            {(Object.keys(vehicleOriginLabels) as VehicleOrigin[]).map((k) => (
              <option key={k} value={k}>
                {vehicleOriginLabels[k]}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      {vehicleErrors.vehicleId && (
        <p className="text-sm text-morocco-600">{vehicleErrors.vehicleId.message}</p>
      )}

      {loading ? (
        <LoadingState label="Recherche véhicules…" minHeight="min-h-[10rem]" size="sm" />
      ) : (
        <>
          <p className="text-xs text-navy-500">
            {hits.length} véhicule{hits.length !== 1 ? "s" : ""} — cliquez sur une carte pour continuer
          </p>
          <div className="grid max-h-[min(420px,50vh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {hits.map((v) => {
              const active = vehicleId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVehicle(v)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                    active
                      ? "border-gold-500 bg-gold-500/15 ring-2 ring-gold-400/40"
                      : "border-navy-950/10 bg-white hover:border-gold-400/50 hover:bg-cream-50"
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                        active ? "bg-gold-500/20" : "bg-navy-950/5"
                      )}
                    >
                      {v.mainPhoto ? (
                        <UploadImage src={v.mainPhoto} alt="" fill className="object-cover" />
                      ) : (
                        <Car className={cn("h-7 w-7", active ? "text-gold-700" : "text-navy-400")} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy-950">
                        {formatVehicleTitle(v)}
                      </p>
                      <p className="text-xs text-navy-500">
                        {v.year} · {v.mileage.toLocaleString("fr-FR")} km
                        {v.color ? ` · ${v.color}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-navy-500">{v.internalRef}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-medium">
                        <span className="rounded bg-navy-950/5 px-1.5 py-0.5 text-navy-600">
                          {v.depot.name}
                        </span>
                        {v.plate && (
                          <span className="rounded bg-navy-950/5 px-1.5 py-0.5 text-navy-600">
                            {v.plate}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gold-800">
                        {v.targetSalePrice ? formatMoney(v.targetSalePrice) : "Prix à définir"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {hits.length === 0 && (
            <p className="rounded-lg border border-dashed border-navy-950/15 py-8 text-center text-sm text-navy-400">
              Aucun véhicule disponible pour ces critères.
            </p>
          )}
        </>
      )}
    </section>
  );
}
