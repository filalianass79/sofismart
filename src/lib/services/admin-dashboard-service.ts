import { prisma } from "@/lib/prisma";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { fr } from "date-fns/locale";

export type DashboardPeriod = "day" | "month" | "year";

export type TimeBucket = { key: string; label: string; revenue: number; margin: number; count: number };

export type CommercialStat = {
  id: string | null;
  name: string;
  salesCount: number;
  revenue: number;
  margin: number;
};

export type AdminDashboardData = {
  period: DashboardPeriod;
  periodLabel: string;
  kpis: {
    revenue: number;
    margin: number;
    salesCount: number;
    purchasesCount: number;
    purchasesAmount: number;
    inStock: number;
    reserved: number;
    sold: number;
    clientsActive: number;
    pendingValidation: number;
  };
  salesBuckets: TimeBucket[];
  purchaseBuckets: TimeBucket[];
  byCommercial: CommercialStat[];
  vehicleByStatus: { status: string; label: string; count: number }[];
  depots: { id: string; name: string; vehicles: number; maxCapacity: number; pct: number }[];
  depotAlerts: string[];
  pendingValidationSales: {
    id: string;
    reference: string;
    commercial: string | null;
    client: string | null;
  }[];
  recentSales: {
    id: string;
    reference: string;
    saleDate: string;
    revenue: number;
    commercial: string | null;
    client: string | null;
    vehicle: string;
  }[];
};

const VEHICLE_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "En stock",
  RESERVED: "Réservé",
  SOLD: "Vendu",
  DELIVERED: "Livré",
  EXIT_PENDING: "Sortie en attente",
  IN_REPAIR: "Réparation",
  IN_TRANSIT: "Transit",
  PREPARATION: "Préparation",
};

function saleNet(s: { price: unknown; discount: unknown; finalPrice?: unknown }) {
  const fp = Number(s.finalPrice);
  if (fp > 0) return fp;
  return Number(s.price) - Number(s.discount);
}

function periodRange(period: DashboardPeriod): { from: Date; to: Date; label: string } {
  const now = new Date();
  if (period === "day") {
    return {
      from: startOfDay(subDays(now, 29)),
      to: endOfDay(now),
      label: "30 derniers jours",
    };
  }
  if (period === "year") {
    return {
      from: startOfYear(subYears(now, 4)),
      to: endOfYear(now),
      label: "5 dernières années",
    };
  }
  return {
    from: startOfMonth(subMonths(now, 11)),
    to: endOfMonth(now),
    label: "12 derniers mois",
  };
}

function bucketKey(d: Date, period: DashboardPeriod): string {
  if (period === "day") return format(d, "yyyy-MM-dd");
  if (period === "year") return format(d, "yyyy");
  return format(d, "yyyy-MM");
}

function bucketLabel(key: string, period: DashboardPeriod): string {
  if (period === "day") {
    const d = new Date(key);
    return format(d, "d MMM", { locale: fr });
  }
  if (period === "year") return key;
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return format(d, "MMM yy", { locale: fr });
}

function buildEmptyBuckets(period: DashboardPeriod): TimeBucket[] {
  const now = new Date();
  const keys: string[] = [];
  if (period === "day") {
    for (let i = 29; i >= 0; i--) keys.push(bucketKey(subDays(now, i), "day"));
  } else if (period === "year") {
    for (let i = 4; i >= 0; i--) keys.push(bucketKey(subYears(now, i), "year"));
  } else {
    for (let i = 11; i >= 0; i--) keys.push(bucketKey(subMonths(now, i), "month"));
  }
  return keys.map((key) => ({
    key,
    label: bucketLabel(key, period),
    revenue: 0,
    margin: 0,
    count: 0,
  }));
}

export async function getAdminDashboardData(period: DashboardPeriod = "month"): Promise<AdminDashboardData> {
  const { from, to, label: periodLabel } = periodRange(period);
  const saleWhere = {
    status: { not: "CANCELLED" as const },
    saleDate: { gte: from, lte: to },
  };
  const purchaseWhere = {
    status: { not: "CANCELLED" as const },
    purchaseDate: { gte: from, lte: to },
  };

  const [
    salesInPeriod,
    purchasesInPeriod,
    inStock,
    reserved,
    sold,
    clientsActive,
    pendingValidationCount,
    pendingValidationSales,
    vehicleGroups,
    depots,
    recentSalesRaw,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: saleWhere,
      select: {
        saleDate: true,
        price: true,
        discount: true,
        finalPrice: true,
        margin: true,
        commercialId: true,
        commercial: { select: { id: true, name: true } },
      },
    }),
    prisma.purchase.findMany({
      where: purchaseWhere,
      select: { purchaseDate: true, totalPurchasePrice: true },
    }),
    prisma.vehicle.count({ where: { status: "IN_STOCK", isArchived: false } }),
    prisma.vehicle.count({ where: { status: "RESERVED", isArchived: false } }),
    prisma.vehicle.count({ where: { status: { in: ["SOLD", "DELIVERED"] } } }),
    prisma.client.count({ where: { isArchived: false } }),
    prisma.sale.count({ where: { status: "PENDING_VALIDATION" } }),
    prisma.sale.findMany({
      where: { status: "PENDING_VALIDATION" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        reference: true,
        commercial: { select: { name: true } },
        client: { select: { name: true } },
      },
    }),
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { isArchived: false },
      _count: { id: true },
    }),
    prisma.depot.findMany({
      include: { _count: { select: { vehicles: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.sale.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { saleDate: "desc" },
      take: 8,
      select: {
        id: true,
        reference: true,
        saleDate: true,
        price: true,
        discount: true,
        finalPrice: true,
        commercial: { select: { name: true } },
        client: { select: { name: true } },
        vehicle: { include: { brand: true, carModel: true } },
      },
    }),
  ]);

  const salesBuckets = buildEmptyBuckets(period);
  const purchaseBuckets = buildEmptyBuckets(period);
  const salesMap = new Map(salesBuckets.map((b) => [b.key, b]));
  const purchaseMap = new Map(purchaseBuckets.map((b) => [b.key, b]));

  let revenue = 0;
  let margin = 0;
  const commercialMap = new Map<string, CommercialStat>();

  for (const s of salesInPeriod) {
    const net = saleNet(s);
    const m = Number(s.margin);
    revenue += net;
    margin += m;

    const k = bucketKey(new Date(s.saleDate), period);
    const bucket = salesMap.get(k);
    if (bucket) {
      bucket.revenue += net;
      bucket.margin += m;
      bucket.count += 1;
    }

    const cid = s.commercialId ?? "_none";
    const existing = commercialMap.get(cid) ?? {
      id: s.commercialId,
      name: s.commercial?.name ?? "Non assigné",
      salesCount: 0,
      revenue: 0,
      margin: 0,
    };
    existing.salesCount += 1;
    existing.revenue += net;
    existing.margin += m;
    commercialMap.set(cid, existing);
  }

  let purchasesAmount = 0;
  for (const p of purchasesInPeriod) {
    const amt = Number(p.totalPurchasePrice);
    purchasesAmount += amt;
    const k = bucketKey(new Date(p.purchaseDate), period);
    const bucket = purchaseMap.get(k);
    if (bucket) {
      bucket.revenue += amt;
      bucket.count += 1;
    }
  }

  const byCommercial = [...commercialMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const vehicleByStatus = vehicleGroups
    .map((g) => ({
      status: g.status,
      label: VEHICLE_STATUS_LABELS[g.status] ?? g.status,
      count: g._count.id,
    }))
    .sort((a, b) => b.count - a.count);

  const depotRows = depots.map((d) => {
    const pct = d.maxCapacity > 0 ? Math.round((d._count.vehicles / d.maxCapacity) * 100) : 0;
    return {
      id: d.id,
      name: d.name,
      vehicles: d._count.vehicles,
      maxCapacity: d.maxCapacity,
      pct,
    };
  });

  const depotAlerts = depotRows.filter((d) => d.pct >= 85).map((d) => d.name);

  const recentSales = recentSalesRaw.map((s) => ({
    id: s.id,
    reference: s.reference,
    saleDate: s.saleDate.toISOString(),
    revenue: saleNet(s),
    commercial: s.commercial?.name ?? null,
    client: s.client?.name ?? null,
    vehicle: [s.vehicle.brand.label, s.vehicle.carModel.label].filter(Boolean).join(" "),
  }));

  return {
    period,
    periodLabel,
    kpis: {
      revenue,
      margin,
      salesCount: salesInPeriod.length,
      purchasesCount: purchasesInPeriod.length,
      purchasesAmount,
      inStock,
      reserved,
      sold,
      clientsActive,
      pendingValidation: pendingValidationCount,
    },
    salesBuckets,
    purchaseBuckets,
    byCommercial,
    vehicleByStatus,
    depots: depotRows,
    depotAlerts,
    pendingValidationSales: pendingValidationSales.map((s) => ({
      id: s.id,
      reference: s.reference,
      commercial: s.commercial?.name ?? null,
      client: s.client?.name ?? null,
    })),
    recentSales,
  };
}

export function parseDashboardPeriod(value?: string | null): DashboardPeriod {
  if (value === "day" || value === "year") return value;
  return "month";
}
