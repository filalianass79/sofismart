import type { DocumentCategory, VehicleCondition, VehicleStatus } from "@/generated/prisma/enums";
import type { VehicleWizardValues } from "@/lib/validations/vehicle";

type VehicleWithDocs = {
  internalRef: string;
  brandId: string;
  modelId: string;
  version: string | null;
  year: number;
  firstRegistrationDate: Date | null;
  mileage: number;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  interiorColor: string | null;
  vin: string | null;
  plate: string | null;
  matriculeW: string | null;
  origin: string;
  originCountry: string | null;
  vehicleCondition: VehicleCondition | null;
  conditionNotes: string | null;
  targetSalePrice: unknown;
  status: VehicleStatus;
  depotId: string;
  purchasePrice: unknown;
  extraFeesTotal: unknown;
  documents?: {
    id: string;
    category: DocumentCategory;
    originalName: string;
    path: string;
  }[];
};

export function buildVehicleWizardValues(vehicle: VehicleWithDocs): VehicleWizardValues {
  return {
    vehicle: {
      brandId: vehicle.brandId,
      modelId: vehicle.modelId,
      version: vehicle.version ?? "",
      year: vehicle.year,
      firstRegistrationDate: vehicle.firstRegistrationDate
        ? vehicle.firstRegistrationDate.toISOString().slice(0, 10)
        : "",
      mileage: vehicle.mileage,
      fuel: (vehicle.fuel ?? "") as VehicleWizardValues["vehicle"]["fuel"],
      transmission: (vehicle.transmission ?? "") as VehicleWizardValues["vehicle"]["transmission"],
      color: vehicle.color ?? "",
      interiorColor: vehicle.interiorColor ?? "",
      vin: vehicle.vin ?? "",
      plate: vehicle.plate ?? "",
      matriculeW: vehicle.matriculeW ?? "",
      origin: vehicle.origin as VehicleWizardValues["vehicle"]["origin"],
      originCountry: vehicle.originCountry ?? "Maroc",
      vehicleCondition: vehicle.vehicleCondition ?? undefined,
      conditionNotes: vehicle.conditionNotes ?? "",
      status: vehicle.status,
      depotId: vehicle.depotId,
      internalRef: vehicle.internalRef,
      targetSalePrice:
        vehicle.targetSalePrice != null ? Number(vehicle.targetSalePrice) : undefined,
    },
    pricing: {
      purchasePrice: Number(vehicle.purchasePrice),
      extraFeesTotal: Number(vehicle.extraFeesTotal),
    },
    documents:
      vehicle.documents?.map((d) => ({
        id: d.id,
        category: d.category,
        originalName: d.originalName,
        path: d.path,
      })) ?? [],
  };
}

export const defaultVehicleWizardValues: VehicleWizardValues = {
  vehicle: {
    brandId: "",
    modelId: "",
    version: "",
    year: new Date().getFullYear(),
    firstRegistrationDate: "",
    mileage: 0,
    fuel: "",
    transmission: "",
    color: "",
    interiorColor: "",
    matriculeW: "",
    origin: "USED",
    originCountry: "Maroc",
    status: "IN_STOCK",
    depotId: "",
    conditionNotes: "",
    internalRef: "",
  },
  pricing: {
    purchasePrice: 0,
    extraFeesTotal: 0,
  },
  documents: [],
};
