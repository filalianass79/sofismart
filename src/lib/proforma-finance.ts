import { computeTaxFromRate } from "@/lib/finance";

export function computeProformaAmounts(input: {
  priceHT: number;
  discount: number;
  accessoryFees?: number;
  taxRate: number;
}) {
  const priceHT = Number(input.priceHT);
  const discount = Number(input.discount);
  const accessoryFees = Number(input.accessoryFees ?? 0);
  const taxRate = Number(input.taxRate);
  const grossHT = priceHT + accessoryFees;
  const baseHT = Math.max(0, Math.round((grossHT - discount) * 100) / 100);
  const taxAmount = computeTaxFromRate(baseHT, taxRate);
  const totalTTC = Math.round((baseHT + taxAmount) * 100) / 100;
  return { priceHT, accessoryFees, discount, baseHT, taxRate, taxAmount, totalTTC, grossHT };
}
