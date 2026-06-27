import { prisma } from "@/lib/prisma";
import { salePaymentStatusFromAmounts, purchasePaymentStatusFromAmounts } from "@/lib/finance";
import { nextPaymentReference } from "@/lib/references";
import { syncClientBalances } from "@/lib/services/client-service";
import {
  reversePaymentCashMovement,
  syncPaymentCashMovement,
} from "@/lib/services/payment-cashbox-service";
import type { PaymentCategory, PaymentDirection, PaymentMethod, PaymentValidationStatus } from "@/generated/prisma/enums";
import type { PaymentWizardValues } from "@/lib/validations/payment";

function directionForCategory(cat: PaymentCategory): PaymentDirection {
  if (cat === "CLIENT" || cat === "SALE") return "FROM_CLIENT";
  return "TO_SUPPLIER";
}

export async function createPaymentFromWizard(data: PaymentWizardValues, actorUserId?: string) {
  const paymentReference = await nextPaymentReference(prisma);
  const direction = data.direction ?? directionForCategory(data.category);

  const payment = await prisma.payment.create({
    data: {
      paymentReference,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      paidAt: new Date(data.paidAt),
      method: data.method as PaymentMethod,
      direction,
      validationStatus: data.validationStatus as PaymentValidationStatus,
      clientId: data.clientId ?? null,
      supplierId: data.supplierId ?? null,
      purchaseId: data.purchaseId ?? null,
      saleId: data.saleId ?? null,
      cashboxId: data.cashboxId ?? null,
      bank: data.bank ?? null,
      checkNumber: data.checkNumber ?? null,
      transferReference: data.transferReference ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
    },
  });

  if (data.validationStatus === "VALIDATED") {
    await syncLinkedRecords(payment.id);
    if (data.cashboxId && actorUserId) {
      await syncPaymentCashMovement(payment.id, actorUserId);
    }
  }
  return payment;
}

export async function validatePayment(paymentId: string, actorUserId: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { validationStatus: "VALIDATED" },
  });
  await syncLinkedRecords(paymentId);
  if (payment.cashboxId) {
    await syncPaymentCashMovement(paymentId, actorUserId);
  }
  return payment;
}

export async function cancelPayment(paymentId: string, actorUserId: string, reason?: string | null) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { validationStatus: "CANCELLED", cancelReason: reason ?? null },
  });
  await reversePaymentCashMovement(paymentId, actorUserId, reason ?? "Annulation paiement");
  await syncLinkedRecords(paymentId);
  return payment;
}

export async function syncLinkedRecords(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  if (payment.saleId) {
    const sale = await prisma.sale.findUnique({
      where: { id: payment.saleId },
      include: { payments: { where: { validationStatus: "VALIDATED" } } },
    });
    if (sale) {
      const paid = sale.payments.reduce((a, p) => a + Number(p.amount), 0);
      const due = Number(sale.finalPrice) || Number(sale.price) - Number(sale.discount);
      await prisma.sale.update({
        where: { id: sale.id },
        data: {
          advanceReceived: paid,
          paymentStatus: salePaymentStatusFromAmounts(due, paid),
        },
      });
    }
  }

  if (payment.purchaseId) {
    const purchase = await prisma.purchase.findUnique({
      where: { id: payment.purchaseId },
      include: { payments: { where: { validationStatus: "VALIDATED" } } },
    });
    if (purchase) {
      const paid = purchase.payments.reduce((a, p) => a + Number(p.amount), 0);
      const due = Number(purchase.totalPurchasePrice);
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          advancePaid: paid,
          paymentStatus: purchasePaymentStatusFromAmounts(due, paid),
        },
      });
    }
  }

  if (payment.clientId) await syncClientBalances(payment.clientId);
}
