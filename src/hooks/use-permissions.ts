"use client";

import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac/has-permission";

export function usePermissions() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];

  return {
    can: (perm: string) => hasPermission(permissions, perm),
    permissions,
    roleCode: session?.user?.roleCode,
    isAdmin: session?.user?.roleCode === "ADMIN" || permissions.includes("*"),
  };
}
