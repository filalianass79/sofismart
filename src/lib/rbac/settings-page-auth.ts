import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  hasPermission,
  loadUserPermissions,
  type ResolvedPermissions,
} from "@/lib/rbac/has-permission";

export async function requireSettingsPageAccess(viewPermission: string): Promise<ResolvedPermissions> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, viewPermission) && !hasPermission(perms, "*")) {
    redirect("/dashboard");
  }
  return perms;
}

export function parametresCrudFlags(perms: ResolvedPermissions) {
  return {
    canCreate: hasPermission(perms, "parametres.create"),
    canEdit: hasPermission(perms, "parametres.edit"),
    canDelete: hasPermission(perms, "parametres.delete"),
  };
}

export function depotsCrudFlags(perms: ResolvedPermissions) {
  return {
    canCreate: hasPermission(perms, "depots.create"),
    canEdit: hasPermission(perms, "depots.edit"),
    canDelete: hasPermission(perms, "depots.delete"),
  };
}

export function salariesCrudFlags(perms: ResolvedPermissions) {
  return {
    canCreate: hasPermission(perms, "salaries.create"),
    canEdit: hasPermission(perms, "salaries.edit"),
    canDelete: hasPermission(perms, "salaries.delete"),
    canArchive: hasPermission(perms, "salaries.archive"),
  };
}
