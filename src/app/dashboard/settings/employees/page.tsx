import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { EmployeesManager } from "@/components/settings/employees-manager";

export default async function SettingsEmployeesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "salaries.view")) redirect("/dashboard");

  const depots = await prisma.depot.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <EmployeesManager
      depots={depots}
      canCreate={hasPermission(perms, "salaries.create")}
      canEdit={hasPermission(perms, "salaries.edit")}
    />
  );
}
