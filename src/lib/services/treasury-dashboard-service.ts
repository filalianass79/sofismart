import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import type { TreasuryActor } from "@/lib/treasury/cashbox-access";
import { canViewAllCashboxes, cashboxListWhere } from "@/lib/treasury/cashbox-access";

function toNum(v: unknown): number {
  return v == null ? 0 : Number(v);
}

export async function getTreasuryDashboard(actor: TreasuryActor) {
  const scope = cashboxListWhere(actor);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const cashboxes = await prisma.cashbox.findMany({
    where: { ...scope, status: "ACTIVE" },
    select: { id: true, name: true, currentBalance: true, type: true },
  });

  const cashboxIds = cashboxes.map((c) => c.id);
  const totalBalance = cashboxes.reduce((s, c) => s + toNum(c.currentBalance), 0);

  const todayMovements = await prisma.cashMovement.findMany({
    where: {
      cashboxId: { in: cashboxIds },
      status: "VALIDATED",
      operationDate: { gte: todayStart, lte: todayEnd },
    },
    select: { direction: true, amount: true, type: true, category: true },
  });

  const totalIn = todayMovements
    .filter((m) => m.direction === "IN")
    .reduce((s, m) => s + toNum(m.amount), 0);
  const totalOut = todayMovements
    .filter((m) => m.direction === "OUT")
    .reduce((s, m) => s + toNum(m.amount), 0);

  const pendingTransfers = await prisma.cashTransfer.count({
    where: {
      status: "PENDING_RECEPTION",
      OR: [
        { destinationCashboxId: { in: cashboxIds } },
        ...(canViewAllCashboxes(actor) ? [{}] : []),
      ],
    },
  });

  const pendingValidation = await prisma.cashMovement.count({
    where: {
      cashboxId: { in: cashboxIds },
      status: "PENDING_VALIDATION",
    },
  });

  const lowBalance = cashboxes.filter((c) => toNum(c.currentBalance) < 500);

  const recentMovements = await prisma.cashMovement.findMany({
    where: { cashboxId: { in: cashboxIds } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      cashbox: { select: { name: true, reference: true } },
      createdBy: { select: { name: true } },
    },
  });

  const transfersToConfirm = await prisma.cashTransfer.findMany({
    where: {
      status: "PENDING_RECEPTION",
      destinationCashboxId: { in: cashboxIds },
    },
    take: 10,
    include: {
      sourceCashbox: { select: { name: true } },
      destinationCashbox: { select: { name: true } },
    },
  });

  const pendingOps = await prisma.cashMovement.findMany({
    where: { cashboxId: { in: cashboxIds }, status: "PENDING_VALIDATION" },
    take: 10,
    include: { cashbox: { select: { name: true } } },
  });

  const byCategory = todayMovements.reduce<Record<string, number>>((acc, m) => {
    const key = m.category ?? m.type;
    acc[key] = (acc[key] ?? 0) + toNum(m.amount);
    return acc;
  }, {});

  return {
    kpis: {
      totalBalance,
      activeCashboxes: cashboxes.length,
      totalInToday: totalIn,
      totalOutToday: totalOut,
      pendingTransfers,
      pendingValidation,
      lowBalanceCount: lowBalance.length,
    },
    balanceByCashbox: cashboxes.map((c) => ({
      id: c.id,
      name: c.name,
      balance: toNum(c.currentBalance),
      type: c.type,
    })),
    categoryBreakdown: Object.entries(byCategory).map(([name, amount]) => ({ name, amount })),
    recentMovements,
    transfersToConfirm,
    pendingOperations: pendingOps,
    lowBalanceCashboxes: lowBalance,
  };
}
