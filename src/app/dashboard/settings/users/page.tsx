import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { UsersManager } from "@/components/settings/users-manager";

export default async function SettingsUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "utilisateurs.view")) redirect("/dashboard");

  const linkedIds = (
    await prisma.user.findMany({ where: { employeeId: { not: null } }, select: { employeeId: true } })
  )
    .map((u) => u.employeeId)
    .filter(Boolean) as string[];

  const [employees, roles] = await Promise.all([
    prisma.employee.findMany({
      where: { status: "ACTIVE", id: { notIn: linkedIds } },
      select: {
        id: true,
        reference: true,
        firstName: true,
        lastName: true,
        professionalEmail: true,
        personalEmail: true,
        phone: true,
        jobFunction: true,
      },
      orderBy: { lastName: "asc" },
    }),
    prisma.role.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <UsersManager
      employees={employees}
      roles={roles}
      canCreate={hasPermission(perms, "utilisateurs.create")}
      canEdit={hasPermission(perms, "utilisateurs.edit")}
      canManagePermissions={hasPermission(perms, "utilisateurs.manage_permissions")}
    />
  );
}
