import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { PaymentDirection } from "@/generated/prisma/enums";
import { nextCashMovementReference } from "@/lib/treasury/cashbox-references";
import { createAuditLog } from "@/lib/audit";
import { cancelMovement } from "@/lib/services/cashbox-service";
import { buildTreasuryActor } from "@/lib/treasury/treasury-api";
import { loadUserPermissions } from "@/lib/rbac/has-permission";

function toNumber(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

async function applyValidatedMovement(
  tx: Prisma.TransactionClient,
  cashboxId: string,
  movementId: string,
  direction: "IN" | "OUT",
  amount: number,
  validatorId: string,
): Promise<void> {
  const box = await tx.cashbox.findUniqueOrThrow({ where: { id: cashboxId } });
  if (box.status !== "ACTIVE") throw new Error("Caisse non active");

  const balanceBefore = toNumber(box.currentBalance);
  const balanceAfter = direction === "IN" ? balanceBefore + amount : balanceBefore - amount;

  if (direction === "OUT" && balanceAfter < 0) {
    const limit = box.authorizedLimit != null ? toNumber(box.authorizedLimit) : null;
    if (limit == null || balanceAfter < -limit) {
      throw new Error("Solde caisse insuffisant pour ce paiement");
    }
  }

  await tx.cashbox.update({
    where: { id: cashboxId },
    data: { currentBalance: balanceAfter },
  });

  await tx.cashMovement.update({
    where: { id: movementId },
    data: {
      status: "VALIDATED",
      balanceBefore,
      balanceAfter,
      validatedById: validatorId,
      validatedAt: new Date(),
    },
  });
}

function movementDirectionForPayment(direction: PaymentDirection): "IN" | "OUT" {
  return direction === "FROM_CLIENT" ? "IN" : "OUT";
}

function movementTypeForPayment(direction: PaymentDirection): "CREDIT" | "DEBIT" {
  return direction === "FROM_CLIENT" ? "CREDIT" : "DEBIT";
}

function categoryForPayment(direction: PaymentDirection): string {
  return direction === "FROM_CLIENT" ? "Encaissement client" : "Paiement fournisseur";
}

function buildPaymentReason(payment: {
  paymentReference: string | null;
  direction: PaymentDirection;
  client: { name: string } | null;
  supplier: { name: string } | null;
  sale: { reference: string } | null;
  purchase: { reference: string } | null;
}): string {
  const ref = payment.paymentReference ?? "PAY";
  if (payment.direction === "FROM_CLIENT") {
    const party = payment.client?.name ?? payment.sale?.reference ?? "client";
    return `Encaissement ${ref} — ${party}`;
  }
  const party = payment.supplier?.name ?? payment.purchase?.reference ?? "fournisseur";
  return `Paiement ${ref} — ${party}`;
}

/** Crée un mouvement de caisse lié à un paiement validé (idempotent). */
export async function syncPaymentCashMovement(paymentId: string, actorUserId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      client: { select: { name: true } },
      supplier: { select: { name: true } },
      sale: { select: { reference: true, id: true } },
      purchase: { select: { reference: true, id: true } },
    },
  });

  if (!payment?.cashboxId || payment.validationStatus !== "VALIDATED") return;

  const existing = await prisma.cashMovement.findFirst({
    where: {
      relatedPaymentId: paymentId,
      status: "VALIDATED",
      type: { in: ["CREDIT", "DEBIT"] },
    },
  });
  if (existing) return;

  const amount = toNumber(payment.amount);
  const direction = movementDirectionForPayment(payment.direction);
  const type = movementTypeForPayment(payment.direction);
  const reference = await nextCashMovementReference(prisma);

  await prisma.$transaction(async (tx) => {
    const movement = await tx.cashMovement.create({
      data: {
        reference,
        cashboxId: payment.cashboxId!,
        type,
        status: "VALIDATED",
        amount,
        direction,
        operationDate: payment.paidAt,
        category: categoryForPayment(payment.direction),
        reason: buildPaymentReason(payment),
        paymentMethod: payment.method,
        externalReference: payment.paymentReference,
        relatedPaymentId: payment.id,
        relatedSaleId: payment.saleId,
        relatedPurchaseId: payment.purchaseId,
        createdById: actorUserId,
        validatedById: actorUserId,
        validatedAt: new Date(),
      },
    });

    await applyValidatedMovement(tx, payment.cashboxId!, movement.id, direction, amount, actorUserId);

    await createAuditLog({
      actorUserId,
      action: "PAYMENT_CASH_MOVEMENT",
      module: "caisse",
      targetType: "CashMovement",
      targetId: movement.id,
      newValues: { paymentId, amount, cashboxId: payment.cashboxId },
    });
  });
}

/** Contrepasse le mouvement de caisse lié à un paiement annulé. */
export async function reversePaymentCashMovement(
  paymentId: string,
  actorUserId: string,
  reason: string,
): Promise<void> {
  const movement = await prisma.cashMovement.findFirst({
    where: {
      relatedPaymentId: paymentId,
      status: "VALIDATED",
      type: { in: ["CREDIT", "DEBIT"] },
    },
  });
  if (!movement) return;

  const perms = await loadUserPermissions(prisma, actorUserId);
  const actor = await buildTreasuryActor(actorUserId, perms);
  await cancelMovement(actor, movement.id, reason || "Annulation paiement");
}
