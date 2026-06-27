import type { PrismaClient } from "@/generated/prisma/client";
import { randomBytes } from "node:crypto";

type Db = Pick<PrismaClient, "cashbox" | "cashMovement" | "cashTransfer">;

export async function nextCashboxReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CAI-${year}-`;
  const last = await db.cashbox.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextCashMovementReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MVT-${year}-`;
  const last = await db.cashMovement.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextCashTransferReference(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TRF-${year}-`;
  const last = await db.cashTransfer.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last?.reference ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function generateTransferCode(): string {
  return `TRC-${randomBytes(4).toString("hex").toUpperCase()}`;
}
