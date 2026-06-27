import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { buildTreasuryActor } from "@/lib/treasury/treasury-api";
import { getCashbox } from "@/lib/services/cashbox-service";
import { CashboxJournalTable } from "@/components/treasury/cashbox-journal";

type Props = { params: Promise<{ id: string }> };

export default async function CashboxJournalPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.view")) redirect("/dashboard");

  const actor = await buildTreasuryActor(session.user.id, perms);
  const cashbox = await getCashbox(actor, id);
  if (!cashbox) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/treasury/cashboxes/${id}`} className="text-sm text-gold-700 hover:underline">
        ← {cashbox.name}
      </Link>
      <h2 className="font-display text-3xl text-navy-950">Journal de caisse</h2>
      <p className="font-mono text-sm text-navy-500">{cashbox.reference}</p>
      <CashboxJournalTable cashboxId={id} />
    </div>
  );
}
