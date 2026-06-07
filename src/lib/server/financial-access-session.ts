import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { userCanViewFinancials } from "@/lib/rbac/financial-access";

export async function getFinancialAccessFromSession(): Promise<{
  canViewFinancials: boolean;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const permissions = session.user.permissions?.length
    ? [...session.user.permissions]
    : [...(await loadUserPermissions(prisma, session.user.id))];
  const roleCode = session.user.roleCode ?? session.user.role;

  return {
    canViewFinancials: userCanViewFinancials(permissions, roleCode),
  };
}
