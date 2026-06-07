"use client";

import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac/has-permission";
import { can } from "@/lib/permissions";
import { NAV_LEGACY_PERM } from "@/lib/navigation/nav-config";
import type { UserRole } from "@/generated/prisma/enums";

export function useNavFilter() {
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const role = session?.user?.role as UserRole | undefined;
  const roleCode = session?.user?.roleCode ?? role;

  function canSee(perm: string) {
    if (hasPermission(perms, perm) || hasPermission(perms, "*")) return true;
    if (!perms.length && role) {
      const leg = NAV_LEGACY_PERM[perm];
      return leg ? can(role, leg) : false;
    }
    return false;
  }

  return { canSee, roleCode, perms };
}
