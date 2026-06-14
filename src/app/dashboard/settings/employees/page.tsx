import { prisma } from "@/lib/prisma";
import { EmployeesManager } from "@/components/settings/employees-manager";
import {
  requireSettingsPageAccess,
  salariesCrudFlags,
} from "@/lib/rbac/settings-page-auth";

export default async function SettingsEmployeesPage() {
  const perms = await requireSettingsPageAccess("salaries.view");
  const flags = salariesCrudFlags(perms);

  const depots = await prisma.depot.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <EmployeesManager
      depots={depots}
      {...flags}
    />
  );
}
