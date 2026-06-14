import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { AuditLogsList } from "@/components/settings/audit-logs-list";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "parametres.view") && !hasPermission(perms, "*")) redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { actorUser: { select: { email: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl text-navy-950 sm:text-2xl">Journal d&apos;audit</h3>
      <AuditLogsList logs={logs} />
    </div>
  );
}
