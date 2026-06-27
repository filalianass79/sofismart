import type { Prisma } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/rbac/has-permission";

export type TreasuryActor = {
  userId: string;
  employeeId: string | null;
  depotId: string | null;
  permissions: Set<string> | string[];
};

export function canViewAllCashboxes(actor: TreasuryActor): boolean {
  return (
    hasPermission(actor.permissions, "*") ||
    hasPermission(actor.permissions, "caisse.view") &&
      (hasPermission(actor.permissions, "caisse.validate") ||
        hasPermission(actor.permissions, "caisse.export"))
  );
}

export function canValidateMovements(actor: TreasuryActor): boolean {
  return hasPermission(actor.permissions, "*") || hasPermission(actor.permissions, "caisse.validate");
}

export function canCreateMovements(actor: TreasuryActor): boolean {
  return hasPermission(actor.permissions, "*") || hasPermission(actor.permissions, "caisse.create");
}

export function cashboxListWhere(actor: TreasuryActor): Prisma.CashboxWhereInput {
  if (canViewAllCashboxes(actor)) return {};
  const or: Prisma.CashboxWhereInput[] = [];
  if (actor.employeeId) {
    or.push({ employeeId: actor.employeeId });
  }
  if (actor.depotId) {
    or.push({ depotId: actor.depotId, type: "DEPOT" });
  }
  if (or.length === 0) return { id: "__none__" };
  return { OR: or };
}

export async function assertCashboxAccess(
  actor: TreasuryActor,
  cashbox: { id: string; employeeId: string | null; depotId: string | null },
): Promise<void> {
  if (canViewAllCashboxes(actor)) return;
  if (actor.employeeId && cashbox.employeeId === actor.employeeId) return;
  if (actor.depotId && cashbox.depotId === actor.depotId) return;
  throw new Error("Accès refusé à cette caisse");
}

export function canReceiveTransfer(
  actor: TreasuryActor,
  transfer: {
    receiverEmployeeId: string | null;
    destinationCashbox: { employeeId: string | null };
  },
): boolean {
  if (canValidateMovements(actor)) return true;
  if (actor.employeeId) {
    if (transfer.receiverEmployeeId === actor.employeeId) return true;
    if (transfer.destinationCashbox.employeeId === actor.employeeId) return true;
  }
  return false;
}
