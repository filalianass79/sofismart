import { formatFinancialMoney } from "@/lib/financial-privacy";

/** Affichage montant achat selon droits (admin / gérant uniquement). */
export const formatPurchaseMoney = formatFinancialMoney;

type PurchaseLike = {
  totalPurchasePrice?: unknown;
  basePrice?: unknown;
  costPrice?: unknown;
  amountHT?: unknown;
  amountTTC?: unknown;
  taxAmount?: unknown;
  advancePaid?: unknown;
  totalExpenses?: unknown;
  discount?: unknown;
  fees?: { amount?: unknown }[];
  payments?: { amount?: unknown }[];
  vehicle?: {
    purchasePrice?: unknown;
    extraFeesTotal?: unknown;
    costPrice?: unknown;
    targetSalePrice?: unknown;
  } | null;
};

/** Retire les montants sensibles des réponses API pour les profils sans accès financier. */
export function stripPurchaseFinancials<T extends PurchaseLike>(purchase: T): T {
  return {
    ...purchase,
    totalPurchasePrice: 0,
    basePrice: 0,
    costPrice: 0,
    amountHT: 0,
    amountTTC: 0,
    taxAmount: 0,
    advancePaid: 0,
    totalExpenses: 0,
    discount: 0,
    fees: purchase.fees?.map((f) => ({ ...f, amount: 0 })),
    payments: purchase.payments?.map((p) => ({ ...p, amount: 0 })),
    vehicle: purchase.vehicle
      ? {
          ...purchase.vehicle,
          purchasePrice: 0,
          extraFeesTotal: 0,
          costPrice: 0,
          targetSalePrice: null,
        }
      : purchase.vehicle,
  };
}

export function stripPurchasesFinancials<T extends PurchaseLike>(rows: T[]): T[] {
  return rows.map(stripPurchaseFinancials);
}
