import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";
import { buildTreasuryActor } from "@/lib/treasury/treasury-api";
import { canReceiveTransfer } from "@/lib/treasury/cashbox-access";
import { getTransfer } from "@/lib/services/cashbox-service";
import { TransferDetailsView } from "@/components/treasury/transfer-details";

type Props = { params: Promise<{ id: string }> };

export default async function CashTransferDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "caisse.view")) redirect("/dashboard");

  const actor = await buildTreasuryActor(session.user.id, perms);
  const transfer = await getTransfer(actor, id);
  if (!transfer) notFound();

  const canReceive =
    transfer.status === "PENDING_RECEPTION" &&
    canReceiveTransfer(actor, {
      receiverEmployeeId: transfer.receiverEmployeeId,
      destinationCashbox: transfer.destinationCashbox,
    });

  return <TransferDetailsView transfer={transfer} canReceive={canReceive} />;
}
