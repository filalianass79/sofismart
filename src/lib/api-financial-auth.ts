import { requireAuth } from "@/lib/api-auth";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { userCanViewFinancials } from "@/lib/rbac/financial-access";
import { prisma } from "@/lib/prisma";

type AuthGate = {
  session: {
    user: {
      id: string;
      roleCode?: string;
      role?: string;
      permissions?: string[];
    };
  };
  permissions?: Set<string> | string[];
};

export function canViewFinancialsFromGate(gate: AuthGate): boolean {
  const perms =
    gate.permissions != null
      ? gate.permissions instanceof Set
        ? [...gate.permissions]
        : gate.permissions
      : gate.session.user.permissions ?? [];
  const roleCode = gate.session.user.roleCode ?? gate.session.user.role;
  return userCanViewFinancials(perms, roleCode);
}

export async function getFinancialFlagsFromRequest(): Promise<
  { canViewFinancials: boolean } | { response: import("next/server").NextResponse }
> {
  const gate = await requireAuth();
  if ("response" in gate) {
    return { response: gate.response as import("next/server").NextResponse };
  }
  const permissions = gate.session.user.permissions?.length
    ? [...gate.session.user.permissions]
    : [...(await loadUserPermissions(prisma, gate.session.user.id))];
  const roleCode = gate.session.user.roleCode ?? gate.session.user.role;
  return { canViewFinancials: userCanViewFinancials(permissions, roleCode) };
}
