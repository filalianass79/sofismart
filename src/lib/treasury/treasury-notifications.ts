import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { dispatchNotificationEventAsync } from "@/lib/notifications/notification-dispatcher";

type TransferWithRelations = {
  id: string;
  amount: unknown;
  reason: string;
  transferCode: string;
  receiverEmployeeId?: string | null;
  sourceCashbox: { name: string; reference?: string };
  destinationCashbox?: { name: string };
  receiverEmployee?: { user?: { id: string } | null; firstName: string; lastName: string } | null;
  createdBy?: { id: string } | null;
};

export async function dispatchCashTransferPending(transfer: TransferWithRelations) {
  const amount = formatMoney(Number(transfer.amount));
  const sourceName = transfer.sourceCashbox.name;
  const userIds: string[] = [];

  if (transfer.receiverEmployee?.user?.id) {
    userIds.push(transfer.receiverEmployee.user.id);
  } else if (transfer.receiverEmployeeId) {
    const emp = await prisma.employee.findUnique({
      where: { id: transfer.receiverEmployeeId },
      include: { user: { select: { id: true } } },
    });
    if (emp?.user?.id) userIds.push(emp.user.id);
  }

  if (userIds.length === 0) return;

  dispatchNotificationEventAsync({
    eventType: "CASH_TRANSFER_PENDING",
    userIds,
    module: "caisse",
    actionUrl: `/dashboard/treasury/cash-transfers/${transfer.id}`,
    category: "ACTION_REQUIRED",
    payload: {
      title: "Nouveau transfert de caisse à valider",
      message: `Vous avez reçu un transfert de ${amount} depuis la caisse ${sourceName}. Veuillez confirmer la réception.`,
      amount,
      sourceCashbox: sourceName,
      reason: transfer.reason,
      transferCode: transfer.transferCode,
      employeeName: transfer.receiverEmployee
        ? `${transfer.receiverEmployee.firstName} ${transfer.receiverEmployee.lastName}`
        : undefined,
    },
  });
}

export async function dispatchCashTransferResolved(
  transfer: TransferWithRelations,
  outcome: "ACCEPTED" | "REJECTED",
  rejectionReason?: string,
) {
  const senderId = transfer.createdBy?.id;
  if (!senderId) return;

  const amount = formatMoney(Number(transfer.amount));
  const eventType = outcome === "ACCEPTED" ? "CASH_TRANSFER_ACCEPTED" : "CASH_TRANSFER_REJECTED";

  dispatchNotificationEventAsync({
    eventType,
    userIds: [senderId],
    module: "caisse",
    actionUrl: `/dashboard/treasury/cash-transfers/${transfer.id}`,
    category: outcome === "ACCEPTED" ? "SUCCESS" : "WARNING",
    payload: {
      title:
        outcome === "ACCEPTED"
          ? "Transfert de caisse accepté"
          : "Transfert de caisse refusé",
      message:
        outcome === "ACCEPTED"
          ? `Votre transfert de ${amount} vers ${transfer.destinationCashbox?.name ?? "la caisse destinataire"} a été accepté.`
          : `Votre transfert de ${amount} a été refusé. Motif : ${rejectionReason ?? "—"}`,
      amount,
      rejectionReason,
    },
  });
}
