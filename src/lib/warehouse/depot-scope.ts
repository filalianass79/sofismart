import { prisma } from "@/lib/prisma";

export type WarehouseDepotScope = {
  isAdmin: boolean;
  depotIds: string[] | null;
  userDepotId: string | null;
};

/** Dépôts accessibles au magasinier (employee.depotId prioritaire). */
export async function getWarehouseDepotScope(userId: string): Promise<WarehouseDepotScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      depotId: true,
      employee: { select: { depotId: true } },
      managedDepots: { select: { id: true } },
    },
  });

  if (!user) {
    return { isAdmin: false, depotIds: [], userDepotId: null };
  }

  if (user.role === "ADMIN") {
    return { isAdmin: true, depotIds: null, userDepotId: user.employee?.depotId ?? user.depotId };
  }

  const ids = new Set<string>();
  const primary = user.employee?.depotId ?? user.depotId;
  if (primary) ids.add(primary);
  if (user.depotId) ids.add(user.depotId);
  for (const d of user.managedDepots) ids.add(d.id);

  return {
    isAdmin: false,
    depotIds: [...ids],
    userDepotId: primary ?? null,
  };
}

export function depotFilter(scope: WarehouseDepotScope): { depotId?: string | { in: string[] } } {
  if (scope.isAdmin) return {};
  if (!scope.depotIds?.length) return { depotId: { in: [] } };
  if (scope.depotIds.length === 1) return { depotId: scope.depotIds[0] };
  return { depotId: { in: scope.depotIds } };
}

export async function assertDepotAccess(userId: string, depotId: string) {
  const scope = await getWarehouseDepotScope(userId);
  if (scope.isAdmin) return scope;
  if (!scope.depotIds?.includes(depotId)) {
    throw new Error("Accès refusé : ce dépôt ne vous est pas affecté.");
  }
  return scope;
}
