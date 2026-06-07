import type { FuelType, TransmissionType } from "@/generated/prisma/enums";

export const fuelTypeLabels: Record<FuelType, string> = {
  DIESEL: "Diesel",
  ESSENCE: "Essence",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
};

export const transmissionTypeLabels: Record<TransmissionType, string> = {
  MANUELLE: "Manuelle",
  AUTOMATIQUE: "Automatique",
};

/** Palette de couleurs proposées pour les véhicules */
export const vehicleColorPalette = [
  { value: "Noir", hex: "#1a1a1a" },
  { value: "Blanc", hex: "#f5f5f4" },
  { value: "Gris", hex: "#6b7280" },
  { value: "Argent", hex: "#c0c0c0" },
  { value: "Bleu", hex: "#1e3a5f" },
  { value: "Rouge", hex: "#b91c1c" },
  { value: "Beige", hex: "#d4c4a8" },
  { value: "Marron", hex: "#78350f" },
  { value: "Vert", hex: "#166534" },
  { value: "Orange", hex: "#ea580c" },
  { value: "Jaune", hex: "#ca8a04" },
  { value: "Violet", hex: "#6d28d9" },
] as const;

export function getVehicleColorHex(color: string | null | undefined): string {
  if (!color) return "#e5e7eb";
  const found = vehicleColorPalette.find((c) => c.value === color);
  return found?.hex ?? "#9ca3af";
}

export type BrandOption = { id: string; label: string; logo: string | null };
export type ModelOption = { id: string; label: string; brandId: string; photo: string | null };

/** Valeurs catalogue connues à l’édition (affichage immédiat avant chargement API). */
export type InitialVehicleCatalog = {
  brandId: string;
  brandLabel: string;
  modelId: string;
  modelLabel: string;
};

export function mergeBrandOptions(rows: BrandOption[], catalog?: InitialVehicleCatalog): BrandOption[] {
  if (!catalog?.brandId || rows.some((b) => b.id === catalog.brandId)) return rows;
  return [{ id: catalog.brandId, label: catalog.brandLabel, logo: null }, ...rows];
}

export function catalogFromVehicle(v: {
  brandId: string;
  modelId: string;
  brand?: { label: string } | null;
  carModel?: { label: string } | null;
}): InitialVehicleCatalog | undefined {
  if (!v.brandId || !v.modelId) return undefined;
  return {
    brandId: v.brandId,
    brandLabel: v.brand?.label ?? "Marque",
    modelId: v.modelId,
    modelLabel: v.carModel?.label ?? "Modèle",
  };
}

export function mergeModelOptions(rows: ModelOption[], catalog?: InitialVehicleCatalog): ModelOption[] {
  if (!catalog?.modelId || rows.some((m) => m.id === catalog.modelId)) return rows;
  return [
    { id: catalog.modelId, label: catalog.modelLabel, brandId: catalog.brandId, photo: null },
    ...rows,
  ];
}

export function formatVehicleTitle(v: {
  brand: { label: string };
  carModel: { label: string };
  version?: string | null;
}) {
  const base = `${v.brand.label} ${v.carModel.label}`.trim();
  return v.version ? `${base} ${v.version}` : base;
}
