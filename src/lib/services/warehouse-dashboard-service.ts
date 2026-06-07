import { prisma } from "@/lib/prisma";
import { depotFilter, type WarehouseDepotScope } from "@/lib/warehouse/depot-scope";
import type { Prisma } from "@/generated/prisma/client";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getWarehouseStats(scope: WarehouseDepotScope) {
  const depot = depotFilter(scope);
  const today = startOfDay();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const [
    vehiclesInDepot,
    pendingDeliveries,
    deliveredToday,
    deliveredWeek,
    deliveredMonth,
    pendingSigned,
    signedUploaded,
  ] = await Promise.all([
    prisma.vehicle.count({
      where: {
        ...depot,
        status: { in: ["IN_STOCK", "RESERVED", "PREPARATION", "EXIT_PENDING"] },
      },
    }),
    prisma.sale.count({
      where: {
        status: "VALIDATED",
        deliveryStatus: "EXIT_PENDING",
        ...depot,
      },
    }),
    prisma.deliveryNote.count({
      where: {
        ...depot,
        deliveredAt: { gte: today },
        status: { in: ["DELIVERED", "SIGNED_UPLOADED"] },
      },
    }),
    prisma.deliveryNote.count({
      where: {
        ...depot,
        deliveredAt: { gte: weekStart },
        status: { in: ["DELIVERED", "SIGNED_UPLOADED"] },
      },
    }),
    prisma.deliveryNote.count({
      where: {
        ...depot,
        deliveredAt: { gte: monthStart },
        status: { in: ["DELIVERED", "SIGNED_UPLOADED"] },
      },
    }),
    prisma.deliveryNote.count({
      where: {
        ...depot,
        status: { in: ["GENERATED", "DELIVERED"] },
        signedDocumentUrl: null,
        documents: { none: { type: "SIGNED_DELIVERY_NOTE" } },
      },
    }),
    prisma.deliveryNote.count({
      where: {
        ...depot,
        OR: [
          { signedDocumentUrl: { not: null } },
          { documents: { some: { type: "SIGNED_DELIVERY_NOTE" } } },
        ],
      },
    }),
  ]);

  return {
    vehiclesInDepot,
    pendingDeliveries,
    deliveredToday,
    deliveredWeek,
    deliveredMonth,
    pendingSigned,
    signedUploaded,
  };
}

export type PendingDeliveryFilters = {
  q?: string;
  saleDateFrom?: string;
  saleDateTo?: string;
  brandId?: string;
  modelId?: string;
  commercialId?: string;
};

export async function getPendingDeliveries(
  scope: WarehouseDepotScope,
  filters: PendingDeliveryFilters = {}
) {
  const depot = depotFilter(scope);
  const where: Prisma.SaleWhereInput = {
    status: "VALIDATED",
    deliveryStatus: "EXIT_PENDING",
    ...depot,
    exitVoucher: { is: { status: "PENDING" } },
    ...(filters.commercialId ? { commercialId: filters.commercialId } : {}),
    ...(filters.saleDateFrom || filters.saleDateTo
      ? {
          saleDate: {
            ...(filters.saleDateFrom ? { gte: new Date(filters.saleDateFrom) } : {}),
            ...(filters.saleDateTo ? { lte: new Date(filters.saleDateTo) } : {}),
          },
        }
      : {}),
    ...(filters.brandId || filters.modelId
      ? {
          vehicle: {
            ...(filters.brandId ? { brandId: filters.brandId } : {}),
            ...(filters.modelId ? { modelId: filters.modelId } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { reference: { contains: filters.q, mode: "insensitive" } },
            { client: { name: { contains: filters.q, mode: "insensitive" } } },
            { client: { phone: { contains: filters.q, mode: "insensitive" } } },
            { vehicle: { plate: { contains: filters.q, mode: "insensitive" } } },
            { vehicle: { vin: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prisma.sale.findMany({
    where,
    orderBy: { saleDate: "desc" },
    take: 100,
    include: {
      client: { select: { id: true, name: true, phone: true, cin: true, ice: true } },
      vehicle: {
        include: { brand: { select: { label: true } }, carModel: { select: { label: true } } },
      },
      commercial: { select: { id: true, name: true } },
      exitVoucher: { select: { id: true, reference: true, secureToken: true, status: true } },
      deliveryNote: {
        select: {
          id: true,
          reference: true,
          status: true,
          pdfUrl: true,
          signedDocumentUrl: true,
          qrToken: true,
        },
      },
    },
  });
}

export async function getDepotVehicles(
  scope: WarehouseDepotScope,
  filters: {
    q?: string;
    status?: string;
    brandId?: string;
    modelId?: string;
    origin?: string;
  } = {}
) {
  const depot = depotFilter(scope);
  return prisma.vehicle.findMany({
    where: {
      ...depot,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.brandId ? { brandId: filters.brandId } : {}),
      ...(filters.modelId ? { modelId: filters.modelId } : {}),
      ...(filters.origin ? { origin: filters.origin as never } : {}),
      ...(filters.q
        ? {
            OR: [
              { plate: { contains: filters.q, mode: "insensitive" } },
              { vin: { contains: filters.q, mode: "insensitive" } },
              { internalRef: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      brand: { select: { label: true } },
      carModel: { select: { label: true } },
      photos: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
}

export type DeliveryHistoryPeriod = "day" | "week" | "month";

export async function getDeliveryHistory(
  scope: WarehouseDepotScope,
  period: DeliveryHistoryPeriod = "month"
) {
  const depot = depotFilter(scope);
  const now = new Date();
  const from =
    period === "day"
      ? startOfDay(now)
      : period === "week"
        ? startOfWeek(now)
        : startOfMonth(now);

  const rows = await prisma.deliveryNote.findMany({
    where: {
      ...depot,
      deliveredAt: { gte: from },
      status: { in: ["DELIVERED", "SIGNED_UPLOADED"] },
    },
    orderBy: { deliveredAt: "desc" },
    take: 200,
    include: {
      sale: { select: { reference: true, validatedAt: true, saleDate: true } },
      client: { select: { name: true } },
      vehicle: {
        include: { brand: { select: { label: true } }, carModel: { select: { label: true } } },
      },
      deliveredBy: { select: { name: true } },
      documents: { where: { type: "SIGNED_DELIVERY_NOTE" }, take: 1 },
    },
  });

  let avgDelayHours: number | null = null;
  const delays: number[] = [];
  for (const r of rows) {
    if (!r.deliveredAt) continue;
    const start = r.sale.validatedAt ?? r.sale.saleDate;
    delays.push((r.deliveredAt.getTime() - start.getTime()) / 3600000);
  }
  if (delays.length) {
    avgDelayHours = Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10;
  }

  return { rows, period, from: from.toISOString(), count: rows.length, avgDelayHours };
}
