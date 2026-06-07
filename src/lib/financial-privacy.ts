import { formatMoney } from "@/lib/utils";

/** Affichage montant sensible selon droits (admin / gérant). */
export function formatFinancialMoney(
  amount: number | string | { toString(): string } | null | undefined,
  canViewFinancials: boolean,
): string {
  if (!canViewFinancials) return "—";
  if (amount == null || amount === "") return "—";
  return formatMoney(amount);
}

type VehicleFinancialFields = {
  purchasePrice?: unknown;
  extraFeesTotal?: unknown;
  costPrice?: unknown;
  targetSalePrice?: unknown;
  finalSalePrice?: unknown;
};

export function stripVehicleFinancials<T extends VehicleFinancialFields>(vehicle: T): T {
  return {
    ...vehicle,
    purchasePrice: 0,
    extraFeesTotal: 0,
    costPrice: 0,
  };
}

type SaleFinancialFields = {
  margin?: unknown;
  marginRate?: unknown;
  costPrice?: unknown;
};

export function stripSaleFinancials<T extends SaleFinancialFields>(sale: T): T {
  return {
    ...sale,
    margin: 0,
    marginRate: 0,
    costPrice: 0,
  };
}

export function stripVehiclePurchaseBlock<
  T extends {
    fees?: { amount?: unknown }[];
    payments?: { amount?: unknown }[];
    totalPurchasePrice?: unknown;
    basePrice?: unknown;
    costPrice?: unknown;
    amountHT?: unknown;
    amountTTC?: unknown;
    taxAmount?: unknown;
  },
>(purchase: T): T {
  return {
    ...purchase,
    totalPurchasePrice: 0,
    basePrice: 0,
    costPrice: 0,
    amountHT: 0,
    amountTTC: 0,
    taxAmount: 0,
    fees: purchase.fees?.map((f) => ({ ...f, amount: 0 })),
    payments: purchase.payments?.map((p) => ({ ...p, amount: 0 })),
  };
}

export function stripVehicleDetailForApi<
  T extends VehicleFinancialFields & {
    purchase?: ReturnType<typeof stripVehiclePurchaseBlock> | null;
    sale?: (SaleFinancialFields & { payments?: { amount?: unknown }[] }) | null;
  },
>(vehicle: T, canViewFinancials: boolean): T {
  if (canViewFinancials) return vehicle;
  const stripped = stripVehicleFinancials(vehicle);
  return {
    ...stripped,
    purchase: vehicle.purchase ? stripVehiclePurchaseBlock(vehicle.purchase) : vehicle.purchase,
    sale: vehicle.sale
      ? {
          ...stripSaleFinancials(vehicle.sale),
          payments: vehicle.sale.payments?.map((p) => ({ ...p, amount: 0 })),
        }
      : vehicle.sale,
  };
}
