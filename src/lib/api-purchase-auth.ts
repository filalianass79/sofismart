import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import {
  userCanCreatePurchases,
  userCanDeletePurchases,
  userCanEditPurchases,
  userCanViewPurchases,
} from "@/lib/rbac/purchase-access";
import { userCanViewFinancials } from "@/lib/rbac/financial-access";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac/has-permission";

export type PurchaseAccessContext = {
  session: { user: { id: string; roleCode?: string; role?: string; permissions?: string[] } };
  permissions: string[];
  canViewFinancials: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
};

async function resolvePermissions(userId: string, sessionPerms?: string[]) {
  if (sessionPerms?.length) return [...sessionPerms];
  return [...(await loadUserPermissions(prisma, userId))];
}

export async function requirePurchaseViewAccess(): Promise<
  PurchaseAccessContext | { response: NextResponse }
> {
  const gate = await requireAuth();
  if ("response" in gate) {
    return { response: gate.response as NextResponse };
  }

  const permissions = await resolvePermissions(gate.session.user.id, gate.session.user.permissions);
  const roleCode = gate.session.user.roleCode ?? gate.session.user.role;

  if (
    !userCanViewPurchases(permissions, roleCode) &&
    !hasPermission(permissions, "purchases:*")
  ) {
    return { response: NextResponse.json({ error: "Permission refusée" }, { status: 403 }) };
  }

  return {
    session: gate.session,
    permissions,
    canViewFinancials: userCanViewFinancials(permissions, roleCode),
    canEdit: userCanEditPurchases(permissions, roleCode),
    canCreate: userCanCreatePurchases(permissions, roleCode),
    canDelete: userCanDeletePurchases(permissions, roleCode),
  };
}

export async function requirePurchaseEditAccess(): Promise<
  PurchaseAccessContext | { response: NextResponse }
> {
  const view = await requirePurchaseViewAccess();
  if ("response" in view) return view;
  if (!view.canEdit) {
    return { response: NextResponse.json({ error: "Modification non autorisée" }, { status: 403 }) };
  }
  return view;
}

export async function requirePurchaseCreateAccess(): Promise<
  PurchaseAccessContext | { response: NextResponse }
> {
  const view = await requirePurchaseViewAccess();
  if ("response" in view) return view;
  if (!view.canCreate) {
    return { response: NextResponse.json({ error: "Création non autorisée" }, { status: 403 }) };
  }
  return view;
}
