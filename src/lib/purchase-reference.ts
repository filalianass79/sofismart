import type { PrismaClient } from "@/generated/prisma/client";

export async function generatePurchaseReference(
  prisma: PrismaClient | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACH-${year}-`;
  const last = await prisma.purchase.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last ? Number.parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function generateVehicleInternalRef(
  prisma: PrismaClient | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `V-${year}-`;
  const last = await prisma.vehicle.findFirst({
    where: { internalRef: { startsWith: prefix } },
    orderBy: { internalRef: "desc" },
    select: { internalRef: true },
  });
  const seq = last ? Number.parseInt(last.internalRef.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
