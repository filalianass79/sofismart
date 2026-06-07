import type { PurchasePaymentStatus, SalePaymentStatus } from "@/generated/prisma/enums";

/** Calculs financiers (nombres décimaux côté métier) */
export function sumFees(fees: { amount: unknown }[]): number {
  return fees.reduce((acc, f) => acc + Number(f.amount), 0);
}

export function computeCostPrice(basePrice: number, feesTotal: number): number {
  return Math.round((basePrice + feesTotal) * 100) / 100;
}

export function computeSaleMargin(
  salePrice: number,
  discount: number,
  costPrice: number
): number {
  const net = salePrice - discount;
  return Math.round((net - costPrice) * 100) / 100;
}

export function computeAmountTTC(amountHT: number, taxAmount: number): number {
  return Math.round((amountHT + taxAmount) * 100) / 100;
}

export function computeTaxFromRate(amountHT: number, ratePercent: number): number {
  return Math.round(amountHT * (ratePercent / 100) * 100) / 100;
}

export function computeSaleAmounts(input: {
  price: number;
  discount: number;
  taxAmount?: number;
  taxRatePercent?: number;
  costPrice: number;
}) {
  const price = Number(input.price);
  const discount = Number(input.discount);
  const taxAmount =
    input.taxAmount != null
      ? Number(input.taxAmount)
      : computeTaxFromRate(price, input.taxRatePercent ?? 20);
  const finalPrice = Math.max(0, price - discount);
  const margin = computeSaleMargin(price, discount, input.costPrice);
  return { price, discount, taxAmount, finalPrice, margin };
}

export function computeTotalPurchasePrice(
  amountTTC: number,
  discount: number
): number {
  return Math.max(0, Math.round((amountTTC - discount) * 100) / 100);
}

export function computePurchaseTotals(input: {
  amountHT?: number;
  taxAmount?: number;
  discount?: number;
  fees?: { amount: unknown }[];
  /** Fallback si HT/TVA non renseignés */
  basePrice?: number;
}) {
  const amountHT = Number(input.amountHT ?? input.basePrice ?? 0);
  const taxAmount = Number(input.taxAmount ?? 0);
  const discount = Number(input.discount ?? 0);
  const amountTTC = computeAmountTTC(amountHT, taxAmount);
  const totalPurchasePrice = computeTotalPurchasePrice(amountTTC, discount);
  const totalExpenses = sumFees(input.fees ?? []);
  const costPrice = computeCostPrice(totalPurchasePrice, totalExpenses);
  return { amountHT, taxAmount, amountTTC, discount, totalPurchasePrice, totalExpenses, costPrice };
}

export function purchasePaymentStatusFromAmounts(
  totalDue: number,
  totalPaid: number
): PurchasePaymentStatus {
  if (totalPaid <= 0) return "UNPAID";
  if (totalPaid >= totalDue - 0.01) return "PAID";
  return "PARTIAL";
}

export function salePaymentStatusFromAmounts(
  totalDue: number,
  totalPaid: number
): SalePaymentStatus {
  if (totalPaid <= 0) return "UNPAID";
  if (totalPaid >= totalDue - 0.01) return "PAID";
  return "PARTIAL";
}
