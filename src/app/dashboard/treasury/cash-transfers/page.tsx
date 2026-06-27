import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { TransferReceptionList } from "@/components/treasury/transfer-reception-list";

export default async function CashTransfersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.view")) redirect("/dashboard");

  return <TransferReceptionList />;
}
