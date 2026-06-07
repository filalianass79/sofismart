import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { userCanViewFinancials } from "@/lib/rbac/financial-access";
import {
  userCanCreatePurchases,
  userCanDeletePurchases,
  userCanEditPurchases,
  userCanViewPurchases,
} from "@/lib/rbac/purchase-access";

export type PurchaseUiAccess = {
  canViewFinancials: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
};

export async function getPurchaseAccessFromSession(): Promise<PurchaseUiAccess | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const permissions = session.user.permissions?.length
    ? [...session.user.permissions]
    : [...(await loadUserPermissions(prisma, session.user.id))];
  const roleCode = session.user.roleCode ?? session.user.role;

  if (!userCanViewPurchases(permissions, roleCode)) return null;

  return {
    canViewFinancials: userCanViewFinancials(permissions, roleCode),
    canEdit: userCanEditPurchases(permissions, roleCode),
    canCreate: userCanCreatePurchases(permissions, roleCode),
    canDelete: userCanDeletePurchases(permissions, roleCode),
  };
}
