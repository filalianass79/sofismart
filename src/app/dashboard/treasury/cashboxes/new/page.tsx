import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { CashboxForm } from "@/components/treasury/cashbox-form";

export default async function NewCashboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.create")) redirect("/dashboard/treasury/cashboxes");

  const [employees, depots] = await Promise.all([
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, reference: true },
    }),
    prisma.depot.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouvelle caisse</h2>
      <CashboxForm employees={employees} depots={depots} />
    </div>
  );
}
