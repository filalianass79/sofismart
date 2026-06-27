import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { CashboxTable } from "@/components/treasury/cashbox-table";

export default async function CashboxesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.view")) redirect("/dashboard");

  return <CashboxTable />;
}
