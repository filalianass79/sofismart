"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ColorPalettePicker } from "@/components/ui/color-palette-picker";
import { FormSection } from "@/components/ui/form-section";
import {
  fuelTypeLabels,
  transmissionTypeLabels,
  mergeBrandOptions,
  mergeModelOptions,
  type BrandOption,
  type InitialVehicleCatalog,
  type ModelOption,
} from "@/lib/vehicle-catalog";
import type { vehicleStepSchema } from "@/lib/validations/purchase";
import type { FuelType, TransmissionType } from "@/generated/prisma/enums";
import type { z } from "zod";

export type VehicleFormValues = { vehicle: z.infer<typeof vehicleStepSchema> };

export function VehicleIdentificationFields({
  register,
  watch,
  setValue,
  depots,
  showCostHint,
  costPrice,
  vehicleOriginLabels,
  vehicleConditionLabels,
  vehicleStatusLabels,
  showAllStatuses,
  hideTargetSalePrice,
  initialCatalog,
}: {
  register: UseFormRegister<VehicleFormValues>;
  watch: UseFormWatch<VehicleFormValues>;
  setValue: UseFormSetValue<VehicleFormValues>;
  depots: { id: string; name: string }[];
  showCostHint?: boolean;
  costPrice?: number;
  vehicleOriginLabels: Record<string, string>;
  vehicleConditionLabels: Record<string, string>;
  vehicleStatusLabels: Record<string, string>;
  showAllStatuses?: boolean;
  hideTargetSalePrice?: boolean;
  /** Marque / modèle actuels (édition achat ou véhicule) */
  initialCatalog?: InitialVehicleCatalog;
}) {
  const [brands, setBrands] = useState<BrandOption[]>(() =>
    initialCatalog?.brandId
      ? [{ id: initialCatalog.brandId, label: initialCatalog.brandLabel, logo: null }]
      : [],
  );
  const [models, setModels] = useState<ModelOption[]>(() =>
    initialCatalog?.modelId
      ? [
          {
            id: initialCatalog.modelId,
            label: initialCatalog.modelLabel,
            brandId: initialCatalog.brandId,
            photo: null,
          },
        ]
      : [],
  );
  const [modelsLoading, setModelsLoading] = useState(false);
  const modelsLoadedForBrand = useRef<string | null>(null);

  const brandId = watch("vehicle.brandId");
  const modelId = watch("vehicle.modelId");
  const color = watch("vehicle.color") || "";
  const selectedBrand = brands.find((b) => b.id === brandId);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: BrandOption[]) =>
        setBrands(
          mergeBrandOptions(
            rows.map((b) => ({ id: b.id, label: b.label, logo: b.logo ?? null })),
            initialCatalog,
          ),
        ),
      );
  }, [initialCatalog]);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      modelsLoadedForBrand.current = null;
      return;
    }
    setModelsLoading(true);
    modelsLoadedForBrand.current = null;
    fetch(`/api/vehicle-models?brandId=${encodeURIComponent(brandId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ModelOption[]) => {
        const normalized = rows.map((m) => ({
          id: m.id,
          label: m.label,
          brandId: m.brandId,
          photo: m.photo ?? null,
        }));
        const merged = mergeModelOptions(
          normalized,
          initialCatalog?.brandId === brandId ? initialCatalog : undefined,
        );
        setModels(merged);
        modelsLoadedForBrand.current = brandId;
      })
      .finally(() => setModelsLoading(false));
  }, [brandId, initialCatalog]);

  useEffect(() => {
    if (modelsLoading || modelsLoadedForBrand.current !== brandId) return;
    if (!brandId || !modelId) return;
    if (models.length > 0 && !models.some((m) => m.id === modelId)) {
      setValue("vehicle.modelId", "");
    }
  }, [brandId, modelId, models, modelsLoading, setValue]);

  useEffect(() => {
    if (!initialCatalog?.brandId) return;
    setValue("vehicle.brandId", initialCatalog.brandId, { shouldValidate: false });
    if (initialCatalog.modelId) {
      setValue("vehicle.modelId", initialCatalog.modelId, { shouldValidate: false });
    }
  }, [initialCatalog, setValue]);

  return (
    <article className="space-y-5">
      {brands.length === 0 && !initialCatalog?.brandId && (
        <p className="catalog-hint">
          <Settings className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
          <span>
            Aucune marque dans le catalogue.{" "}
            <Link href="/dashboard/settings/brands" className="font-semibold text-gold-800 hover:underline">
              Paramètres → Marques
            </Link>{" "}
            pour activer les listes déroulantes.
          </span>
        </p>
      )}

      <FormSection title="Catalogue" description="Marque et modèle définis dans Paramètres">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-navy-700">Marque *</span>
            <select
              className="input-sofi mt-1 w-full"
              value={brandId || ""}
              onChange={(e) => {
                const next = e.target.value;
                setValue("vehicle.brandId", next, { shouldDirty: true, shouldValidate: true });
                setValue("vehicle.modelId", "", { shouldDirty: true });
              }}
            >
              <option value="">— Choisir —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Modèle *</span>
            <select
              className="input-sofi mt-1 w-full"
              value={modelId || ""}
              disabled={!brandId || modelsLoading}
              onChange={(e) => {
                setValue("vehicle.modelId", e.target.value, { shouldDirty: true, shouldValidate: true });
              }}
            >
              <option value="">{modelsLoading ? "Chargement…" : "— Choisir —"}</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedBrand?.logo && (
          <p className="mt-3 flex items-center gap-2 text-xs text-navy-500">
            <span className="relative block h-8 w-8 overflow-hidden rounded border border-navy-950/10 bg-white">
              <Image src={selectedBrand.logo} alt="" fill className="object-contain p-0.5" />
            </span>
            {selectedBrand.label}
          </p>
        )}
      </FormSection>

      <FormSection title="Caractéristiques">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-navy-700">Version</span>
            <input {...register("vehicle.version")} className="input-sofi mt-1 w-full" placeholder="Ex. AMG Line" />
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Année *</span>
            <input type="number" {...register("vehicle.year")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">1ère mise en circulation</span>
            <input type="date" {...register("vehicle.firstRegistrationDate")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Kilométrage</span>
            <input type="number" {...register("vehicle.mileage")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Carburant</span>
            <select {...register("vehicle.fuel")} className="input-sofi mt-1 w-full">
              <option value="">—</option>
              {(Object.keys(fuelTypeLabels) as FuelType[]).map((k) => (
                <option key={k} value={k}>
                  {fuelTypeLabels[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Boîte</span>
            <select {...register("vehicle.transmission")} className="input-sofi mt-1 w-full">
              <option value="">—</option>
              {(Object.keys(transmissionTypeLabels) as TransmissionType[]).map((k) => (
                <option key={k} value={k}>
                  {transmissionTypeLabels[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-3">
            <span className="font-medium text-navy-700">Couleur extérieure</span>
            <div className="mt-2 rounded-lg border border-navy-950/10 bg-white p-3">
              <ColorPalettePicker value={color} onChange={(c) => setValue("vehicle.color", c)} />
            </div>
          </label>
        </div>
      </FormSection>

      <FormSection title="Identification administrative" description="Immatriculation et numéros d'identification">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-navy-700">N° de Chassis</span>
            <input {...register("vehicle.vin")} className="input-sofi mt-1 w-full font-mono text-xs" />
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Immatriculation</span>
            <input {...register("vehicle.plate")} className="input-sofi mt-1 w-full" placeholder="12345-A-12" />
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Matricule W</span>
            <input {...register("vehicle.matriculeW")} className="input-sofi mt-1 w-full" />
          </label>
        </div>
      </FormSection>

      <FormSection title="Affectation & statut">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-navy-700">Origine *</span>
            <select {...register("vehicle.origin")} className="input-sofi mt-1 w-full">
              {Object.entries(vehicleOriginLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">État</span>
            <select {...register("vehicle.vehicleCondition")} className="input-sofi mt-1 w-full">
              <option value="">—</option>
              {Object.entries(vehicleConditionLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Statut initial *</span>
            <select {...register("vehicle.status")} className="input-sofi mt-1 w-full">
              {(showAllStatuses
                ? ([
                    "IN_STOCK",
                    "IN_TRANSIT",
                    "PREPARATION",
                    "IN_REPAIR",
                    "RESERVED",
                    "EXIT_PENDING",
                    "SOLD",
                    "DELIVERED",
                  ] as const)
                : (["IN_STOCK", "IN_TRANSIT", "PREPARATION", "IN_REPAIR"] as const)
              ).map((k) => (
                <option key={k} value={k}>
                  {vehicleStatusLabels[k] ?? k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Dépôt destination *</span>
            <select {...register("vehicle.depotId")} className="input-sofi mt-1 w-full">
              <option value="">—</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          {!hideTargetSalePrice && (
            <label className="text-sm">
              <span className="font-medium text-navy-700">Prix vente estimé</span>
              <input
                type="number"
                step="0.01"
                {...register("vehicle.targetSalePrice")}
                className="input-sofi mt-1 w-full"
              />
            </label>
          )}
          {showCostHint && costPrice != null && (
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-navy-700">Prix de revient (calculé)</span>
              <input
                type="text"
                readOnly
                value={costPrice.toLocaleString("fr-FR", { style: "currency", currency: "MAD" })}
                className="input-sofi mt-1 w-full border-gold-500/30 bg-gold-500/15 font-semibold tabular-nums text-navy-950"
              />
            </label>
          )}
        </div>
        <label className="mt-3 block text-sm">
          <span className="font-medium text-navy-700">Notes techniques</span>
          <textarea {...register("vehicle.conditionNotes")} rows={2} className="input-sofi mt-1 w-full" />
        </label>
      </FormSection>
    </article>
  );
}
