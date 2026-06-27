import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { buildTreasuryActor } from "@/lib/treasury/treasury-api";
import { getCashbox, listCashboxes } from "@/lib/services/cashbox-service";
import { CashboxDetailsView } from "@/components/treasury/cashbox-details";

type Props = { params: Promise<{ id: string }> };

export default async function CashboxDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.view")) redirect("/dashboard");

  const actor = await buildTreasuryActor(session.user.id, perms);
  const cashbox = await getCashbox(actor, id);
  if (!cashbox) notFound();

  const all = await listCashboxes(actor);
  const allCashboxes = all.map((c) => ({ id: c.id, name: c.name, reference: c.reference }));

  return <CashboxDetailsView cashbox={cashbox} allCashboxes={allCashboxes} />;
}
