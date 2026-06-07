import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { jobFunctionLabels } from "@/lib/employee-labels";
import { EmployeeStatusBadge } from "@/components/hr/employee-status-badge";
import { UserStatusBadge } from "@/components/hr/user-status-badge";
import type { EmployeeJobFunction } from "@/generated/prisma/enums";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = { params: Promise<{ id: string }> };

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "salaries.view")) redirect("/dashboard");

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { depot: true, user: { include: { appRole: true } }, documents: true },
  });
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-gold-700">{employee.reference}</p>
          <h2 className="font-display text-3xl text-navy-950">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="text-navy-600">{jobFunctionLabels[employee.jobFunction as EmployeeJobFunction]}</p>
        </div>
        <div className="flex gap-2">
          {hasPermission(perms, "salaries.edit") && (
            <Link
              href={`/dashboard/settings/employees/${id}/edit`}
              className="rounded-lg border border-navy-950/15 px-4 py-2 text-sm font-medium"
            >
              Modifier
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-navy-900">Informations</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-navy-500">Statut</dt>
              <dd>
                <EmployeeStatusBadge status={employee.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">CIN</dt>
              <dd>{employee.cin ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">Téléphone</dt>
              <dd>{employee.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">Email pro</dt>
              <dd>{employee.professionalEmail ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">Dépôt</dt>
              <dd>{employee.depot?.name ?? "—"}</dd>
            </div>
            {employee.hireDate && (
              <div className="flex justify-between">
                <dt className="text-navy-500">Embauche</dt>
                <dd>{format(employee.hireDate, "dd MMM yyyy", { locale: fr })}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-navy-900">Compte utilisateur</h3>
          {employee.user ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-500">Email connexion</dt>
                <dd>{employee.user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Rôle</dt>
                <dd>{employee.user.appRole?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Statut compte</dt>
                <dd>
                  <UserStatusBadge status={employee.user.accountStatus} />
                </dd>
              </div>
              <Link href={`/dashboard/settings/users/${employee.user.id}`} className="text-sm text-gold-700 hover:underline">
                Gérer le compte →
              </Link>
            </dl>
          ) : (
            <p className="text-sm text-navy-600">Aucun compte utilisateur lié.</p>
          )}
        </section>
      </div>

      {employee.notes && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 text-sm text-navy-700">
          <h3 className="mb-2 font-semibold text-navy-900">Notes</h3>
          {employee.notes}
        </section>
      )}
    </div>
  );
}
