import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jobFunctionLabels } from "@/lib/employee-labels";
import type { EmployeeJobFunction } from "@/generated/prisma/enums";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UserEmailPreferencesForm } from "@/components/notifications/user-email-preferences-form";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ passwordUpdated?: string }>;
}) {
  const { passwordUpdated } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employee: { include: { depot: true } }, appRole: true },
  });
  if (!user) redirect("/login");

  const perms = session.user.permissions ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="font-display text-2xl text-navy-950">Mon profil</h2>

      {passwordUpdated === "1" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          Mot de passe mis à jour avec succès.
        </p>
      )}

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-navy-900">Informations personnelles</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-navy-500">Nom</dt>
            <dd className="font-medium">
              {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.name}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-500">Email connexion</dt>
            <dd>{user.email}</dd>
          </div>
          {user.employee && (
            <>
              <div className="flex justify-between">
                <dt className="text-navy-500">Fonction</dt>
                <dd>{jobFunctionLabels[user.employee.jobFunction as EmployeeJobFunction]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Département</dt>
                <dd>{user.employee.department ?? "—"}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-navy-900">Sécurité</h3>
        <p className="text-sm text-navy-600">
          Dernière connexion :{" "}
          {user.lastLoginAt ? format(user.lastLoginAt, "dd/MM/yyyy HH:mm", { locale: fr }) : "—"}
        </p>
        <Link
          href="/dashboard/security/change-password"
          className="mt-3 inline-block text-sm font-medium text-gold-700 hover:underline"
        >
          Modifier mon mot de passe →
        </Link>
      </section>

      <UserEmailPreferencesForm />

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-navy-900">Droits d&apos;accès (lecture seule)</h3>
        <p className="mb-2 text-sm text-navy-600">Rôle : {user.appRole?.name ?? session.user.roleCode}</p>
        <ul className="max-h-48 overflow-y-auto text-xs text-navy-700">
          {perms.slice(0, 80).map((p) => (
            <li key={p} className="font-mono">
              {p}
            </li>
          ))}
          {perms.includes("*") && <li className="font-mono">* (accès complet)</li>}
        </ul>
      </section>
    </div>
  );
}
