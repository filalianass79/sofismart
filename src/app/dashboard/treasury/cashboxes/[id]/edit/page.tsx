import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { buildTreasuryActor } from "@/lib/treasury/treasury-api";
import { getCashbox } from "@/lib/services/cashbox-service";
import { CashboxForm } from "@/components/treasury/cashbox-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditCashboxPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.edit")) redirect(`/dashboard/treasury/cashboxes/${id}`);

  const actor = await buildTreasuryActor(session.user.id, perms);
  const cashbox = await getCashbox(actor, id);
  if (!cashbox) notFound();

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
      <h2 className="font-display text-3xl text-navy-950">Modifier la caisse</h2>
      <CashboxForm
        cashboxId={id}
        employees={employees}
        depots={depots}
        initial={cashbox as unknown as Record<string, unknown>}
      />
    </div>
  );
}
