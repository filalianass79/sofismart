import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import type { TreasuryActor } from "@/lib/treasury/cashbox-access";

export type { TreasuryActor };

export async function buildTreasuryActor(
  userId: string,
  permissions: Set<string> | string[],
): Promise<TreasuryActor> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { employeeId: true, depotId: true },
  });
  return {
    userId,
    employeeId: user?.employeeId ?? null,
    depotId: user?.depotId ?? null,
    permissions,
  };
}

export async function requireTreasuryActor(permission: string): Promise<
  | { response: NextResponse }
  | { actor: TreasuryActor; session: { user: { id: string } } }
> {
  const gate = await requirePermissionFresh(permission);
  if ("response" in gate && gate.response) return { response: gate.response };

  const perms =
    "permissions" in gate && gate.permissions
      ? gate.permissions
      : [...(await loadUserPermissions(prisma, gate.session.user.id))];

  const actor = await buildTreasuryActor(gate.session.user.id, perms);
  return { actor, session: gate.session };
}
