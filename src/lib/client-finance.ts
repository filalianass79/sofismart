import type { Prisma } from "@/generated/prisma/client";

export type ClientFinancialSummary = {
  totalSales: number;
  totalPaid: number;
  outstandingAmount: number;
  currentBalance: number;
  vehiclesCount: number;
  totalMargin: number;
  lastSaleDate: Date | null;
  paymentStatusLabel: string;
};

export function computeClientFinancials(
  sales: {
    saleDate: Date;
    price: Prisma.Decimal | number;
    discount: Prisma.Decimal | number;
    margin: Prisma.Decimal | number;
    payments: { amount: Prisma.Decimal | number; direction: string }[];
  }[]
): ClientFinancialSummary {
  let totalSales = 0;
  let totalPaid = 0;
  let totalMargin = 0;
  let lastSaleDate: Date | null = null;

  for (const sale of sales) {
    const net = Number(sale.price) - Number(sale.discount);
    totalSales += net;
    totalMargin += Number(sale.margin);
    if (!lastSaleDate || sale.saleDate > lastSaleDate) lastSaleDate = sale.saleDate;
    for (const p of sale.payments) {
      if (p.direction === "FROM_CLIENT") totalPaid += Number(p.amount);
    }
  }

  const outstandingAmount = Math.max(0, totalSales - totalPaid);
  const currentBalance = outstandingAmount;

  let paymentStatusLabel = "À jour";
  if (outstandingAmount > 0.01) {
    paymentStatusLabel = totalPaid > 0 ? "Partiellement payé" : "Impayé";
  }

  return {
    totalSales,
    totalPaid,
    outstandingAmount,
    currentBalance,
    vehiclesCount: sales.length,
    totalMargin,
    lastSaleDate,
    paymentStatusLabel,
  };
}
