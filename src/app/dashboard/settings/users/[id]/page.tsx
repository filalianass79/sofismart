import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { UserStatusBadge } from "@/components/hr/user-status-badge";
import { UserActions } from "./user-actions";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "utilisateurs.view")) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { employee: true, appRole: true },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl text-navy-950">Compte utilisateur</h2>
      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-navy-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Nom d&apos;utilisateur</dt>
            <dd>{user.username ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Statut</dt>
            <dd>
              <UserStatusBadge status={user.accountStatus} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Rôle</dt>
            <dd>{user.appRole?.name}</dd>
          </div>
          {user.employee && (
            <div className="flex justify-between">
              <dt className="text-navy-500">Salarié</dt>
              <dd>
                <Link href={`/dashboard/settings/employees/${user.employee.id}`} className="text-gold-700">
                  {user.employee.firstName} {user.employee.lastName}
                </Link>
              </dd>
            </div>
          )}
        </dl>
        {hasPermission(perms, "utilisateurs.edit") && (
          <div className="mt-4 border-t border-navy-950/10 pt-4">
            <UserActions userId={id} />
          </div>
        )}
        {hasPermission(perms, "utilisateurs.manage_permissions") && (
          <Link
            href={`/dashboard/settings/users/${id}/permissions`}
            className="mt-3 inline-block text-sm text-gold-700 hover:underline"
          >
            Permissions personnalisées →
          </Link>
        )}
      </section>
    </div>
  );
}
