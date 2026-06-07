import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
      <h3 className="font-display text-xl text-navy-950">Journal d&apos;audit</h3>
      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-950/5">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 whitespace-nowrap text-navy-600">
                  {format(l.createdAt, "dd/MM/yy HH:mm", { locale: fr })}
                </td>
                <td className="px-4 py-3">{l.actorUser?.email ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-3">{l.module}</td>
                <td className="px-4 py-3 text-navy-600">
                  {l.targetType ? `${l.targetType} ${l.targetId?.slice(0, 8) ?? ""}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
