import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CashMovementStatus,
  CashMovementType,
  CashboxStatus,
} from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit";
import {
  assertCashboxAccess,
  canReceiveTransfer,
  canValidateMovements,
  cashboxListWhere,
  type TreasuryActor,
} from "@/lib/treasury/cashbox-access";
import {
  generateTransferCode,
  nextCashMovementReference,
  nextCashboxReference,
  nextCashTransferReference,
} from "@/lib/treasury/cashbox-references";
import type {
  CashboxInput,
  CreditCashboxInput,
  DebitCashboxInput,
  TransferCashboxInput,
} from "@/lib/validations/treasury";
import { dispatchCashTransferPending, dispatchCashTransferResolved } from "@/lib/treasury/treasury-notifications";

const cashboxInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, reference: true } },
  depot: { select: { id: true, name: true, reference: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

function toNumber(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function movementStatusForActor(actor: TreasuryActor, autoValidate?: boolean): CashMovementStatus {
  if (autoValidate && canValidateMovements(actor)) return "VALIDATED";
  if (canValidateMovements(actor)) return "VALIDATED";
  return "PENDING_VALIDATION";
}

async function applyValidatedMovement(
  tx: Prisma.TransactionClient,
  cashboxId: string,
  movementId: string,
  direction: "IN" | "OUT",
  amount: number,
  validatorId: string,
): Promise<{ balanceBefore: number; balanceAfter: number }> {
  const box = await tx.cashbox.findUniqueOrThrow({ where: { id: cashboxId } });
  if (box.status !== "ACTIVE") throw new Error("Caisse non active");

  const balanceBefore = toNumber(box.currentBalance);
  const balanceAfter = direction === "IN" ? balanceBefore + amount : balanceBefore - amount;

  if (direction === "OUT" && balanceAfter < 0) {
    const limit = box.authorizedLimit != null ? toNumber(box.authorizedLimit) : null;
    if (limit == null || balanceAfter < -limit) {
      throw new Error("Solde insuffisant");
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

  return { balanceBefore, balanceAfter };
}

export async function listCashboxes(actor: TreasuryActor, q?: string) {
  const where: Prisma.CashboxWhereInput = {
    ...cashboxListWhere(actor),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.cashbox.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      ...cashboxInclude,
      movements: {
        where: { status: "VALIDATED" },
        orderBy: { operationDate: "desc" },
        take: 1,
        select: { id: true, operationDate: true, type: true, amount: true },
      },
    },
  });
}

export async function getCashbox(actor: TreasuryActor, id: string) {
  const box = await prisma.cashbox.findUnique({
    where: { id },
    include: cashboxInclude,
  });
  if (!box) return null;
  await assertCashboxAccess(actor, box);
  return box;
}

export async function createCashbox(actor: TreasuryActor, input: CashboxInput) {
  const reference = await nextCashboxReference(prisma);
  const initial = input.initialBalance ?? 0;

  const box = await prisma.cashbox.create({
    data: {
      reference,
      name: input.name,
      type: input.type,
      employeeId: input.employeeId || null,
      depotId: input.depotId || null,
      currency: input.currency,
      initialBalance: initial,
      currentBalance: initial,
      authorizedLimit: input.authorizedLimit ?? null,
      description: input.description ?? null,
      openedAt: input.openedAt ?? new Date(),
      createdById: actor.userId,
    },
    include: cashboxInclude,
  });

  if (initial > 0) {
    const mvtRef = await nextCashMovementReference(prisma);
    await prisma.cashMovement.create({
      data: {
        reference: mvtRef,
        cashboxId: box.id,
        type: "ADJUSTMENT",
        status: "VALIDATED",
        amount: initial,
        direction: "IN",
        reason: "Solde initial",
        operationDate: box.openedAt,
        balanceBefore: 0,
        balanceAfter: initial,
        createdById: actor.userId,
        validatedById: actor.userId,
        validatedAt: new Date(),
      },
    });
  }

  await createAuditLog({
    actorUserId: actor.userId,
    action: "CASHBOX_CREATED",
    module: "caisse",
    targetType: "Cashbox",
    targetId: box.id,
    newValues: { reference, name: input.name, type: input.type },
  });

  return box;
}

export async function updateCashbox(
  actor: TreasuryActor,
  id: string,
  input: Partial<CashboxInput> & { status?: CashboxStatus },
) {
  const existing = await getCashbox(actor, id);
  if (!existing) throw new Error("Caisse introuvable");

  const box = await prisma.cashbox.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      employeeId: input.employeeId,
      depotId: input.depotId,
      authorizedLimit: input.authorizedLimit,
      description: input.description,
      status: input.status,
    },
    include: cashboxInclude,
  });

  await createAuditLog({
    actorUserId: actor.userId,
    action: "CASHBOX_UPDATED",
    module: "caisse",
    targetType: "Cashbox",
    targetId: id,
    newValues: input as object,
  });

  return box;
}

export async function blockCashbox(actor: TreasuryActor, id: string) {
  return updateCashbox(actor, id, { status: "BLOCKED" });
}

export async function closeCashbox(actor: TreasuryActor, id: string) {
  const box = await updateCashbox(actor, id, { status: "CLOSED" });
  await prisma.cashbox.update({ where: { id }, data: { closedAt: new Date() } });
  return box;
}

export async function creditCashbox(
  actor: TreasuryActor,
  cashboxId: string,
  input: CreditCashboxInput,
) {
  const box = await getCashbox(actor, cashboxId);
  if (!box) throw new Error("Caisse introuvable");
  if (box.status !== "ACTIVE") throw new Error("Caisse non active");

  const status = movementStatusForActor(actor, input.autoValidate);
  const reference = await nextCashMovementReference(prisma);

  return prisma.$transaction(async (tx) => {
    const movement = await tx.cashMovement.create({
      data: {
        reference,
        cashboxId,
        type: "CREDIT",
        status,
        amount: input.amount,
        direction: "IN",
        operationDate: input.operationDate ?? new Date(),
        category: input.category ?? null,
        reason: input.reason,
        paymentMethod: input.paymentMethod ?? null,
        externalReference: input.externalReference ?? null,
        notes: input.notes ?? null,
        createdById: actor.userId,
      },
    });

    if (status === "VALIDATED") {
      await applyValidatedMovement(tx, cashboxId, movement.id, "IN", input.amount, actor.userId);
    }

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_MOVEMENT_CREDIT",
      module: "caisse",
      targetType: "CashMovement",
      targetId: movement.id,
      newValues: { amount: input.amount, cashboxId, status },
    });

    return movement;
  });
}

export async function debitCashbox(
  actor: TreasuryActor,
  cashboxId: string,
  input: DebitCashboxInput,
) {
  const box = await getCashbox(actor, cashboxId);
  if (!box) throw new Error("Caisse introuvable");
  if (box.status !== "ACTIVE") throw new Error("Caisse non active");

  const status = movementStatusForActor(actor, input.autoValidate);
  const reference = await nextCashMovementReference(prisma);

  return prisma.$transaction(async (tx) => {
    const movement = await tx.cashMovement.create({
      data: {
        reference,
        cashboxId,
        type: "DEBIT",
        status,
        amount: input.amount,
        direction: "OUT",
        operationDate: input.operationDate ?? new Date(),
        category: input.category ?? null,
        reason: input.reason,
        paymentMethod: input.paymentMethod ?? null,
        externalReference: input.externalReference ?? null,
        notes: input.notes ?? null,
        createdById: actor.userId,
      },
    });

    if (status === "VALIDATED") {
      await applyValidatedMovement(tx, cashboxId, movement.id, "OUT", input.amount, actor.userId);
    }

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_MOVEMENT_DEBIT",
      module: "caisse",
      targetType: "CashMovement",
      targetId: movement.id,
      newValues: { amount: input.amount, cashboxId, status },
    });

    return movement;
  });
}

export async function validateMovement(actor: TreasuryActor, movementId: string) {
  if (!canValidateMovements(actor)) throw new Error("Permission refusée");

  return prisma.$transaction(async (tx) => {
    const movement = await tx.cashMovement.findUniqueOrThrow({
      where: { id: movementId },
      include: { cashbox: true },
    });
    if (movement.status !== "PENDING_VALIDATION") throw new Error("Mouvement non validable");
    await assertCashboxAccess(actor, movement.cashbox);

    const amount = toNumber(movement.amount);
    await applyValidatedMovement(
      tx,
      movement.cashboxId,
      movement.id,
      movement.direction,
      amount,
      actor.userId,
    );

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_MOVEMENT_VALIDATED",
      module: "caisse",
      targetType: "CashMovement",
      targetId: movementId,
    });

    return tx.cashMovement.findUniqueOrThrow({ where: { id: movementId } });
  });
}

export async function cancelMovement(
  actor: TreasuryActor,
  movementId: string,
  cancellationReason: string,
) {
  if (!canValidateMovements(actor)) throw new Error("Permission refusée");

  return prisma.$transaction(async (tx) => {
    const original = await tx.cashMovement.findUniqueOrThrow({
      where: { id: movementId },
      include: { cashbox: true },
    });
    if (original.status !== "VALIDATED") throw new Error("Seuls les mouvements validés peuvent être annulés");
    await assertCashboxAccess(actor, original.cashbox);

    const ref = await nextCashMovementReference(tx);
    const amount = toNumber(original.amount);
    const reverseDirection = original.direction === "IN" ? "OUT" : "IN";
    const reverseType: CashMovementType = "REVERSAL";

    const reversal = await tx.cashMovement.create({
      data: {
        reference: ref,
        cashboxId: original.cashboxId,
        type: reverseType,
        status: "VALIDATED",
        amount,
        direction: reverseDirection,
        operationDate: new Date(),
        reason: `Contrepassation — ${cancellationReason}`,
        reversedMovementId: original.id,
        createdById: actor.userId,
        validatedById: actor.userId,
        validatedAt: new Date(),
        notes: cancellationReason,
      },
    });

    await applyValidatedMovement(
      tx,
      original.cashboxId,
      reversal.id,
      reverseDirection,
      amount,
      actor.userId,
    );

    await tx.cashMovement.update({
      where: { id: original.id },
      data: {
        status: "REVERSED",
        cancelledById: actor.userId,
        cancelledAt: new Date(),
        cancellationReason,
      },
    });

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_MOVEMENT_REVERSED",
      module: "caisse",
      targetType: "CashMovement",
      targetId: movementId,
      newValues: { reversalId: reversal.id, cancellationReason },
    });

    return reversal;
  });
}

export async function createTransfer(actor: TreasuryActor, input: TransferCashboxInput) {
  const source = await getCashbox(actor, input.sourceCashboxId);
  const dest = await getCashbox(actor, input.destinationCashboxId);
  if (!source || !dest) throw new Error("Caisse introuvable");
  if (source.status !== "ACTIVE" || dest.status !== "ACTIVE") throw new Error("Caisse non active");

  const reference = await nextCashTransferReference(prisma);
  const transferCode = generateTransferCode();
  const outRef = await nextCashMovementReference(prisma);

  const transfer = await prisma.$transaction(async (tx) => {
    const tr = await tx.cashTransfer.create({
      data: {
        reference,
        transferCode,
        sourceCashboxId: input.sourceCashboxId,
        destinationCashboxId: input.destinationCashboxId,
        senderEmployeeId: source.employeeId,
        receiverEmployeeId: dest.employeeId,
        amount: input.amount,
        reason: input.reason,
        notes: input.notes ?? null,
        createdById: actor.userId,
      },
      include: {
        sourceCashbox: { select: { id: true, name: true, reference: true } },
        destinationCashbox: {
          select: { id: true, name: true, reference: true, employeeId: true },
        },
        receiverEmployee: { select: { id: true, firstName: true, lastName: true, user: { select: { id: true } } } },
      },
    });

    const outMovement = await tx.cashMovement.create({
      data: {
        reference: outRef,
        cashboxId: input.sourceCashboxId,
        type: "TRANSFER_OUT",
        status: "VALIDATED",
        amount: input.amount,
        direction: "OUT",
        operationDate: new Date(),
        reason: input.reason,
        transferId: tr.id,
        createdById: actor.userId,
        validatedById: actor.userId,
        validatedAt: new Date(),
      },
    });

    await applyValidatedMovement(tx, input.sourceCashboxId, outMovement.id, "OUT", input.amount, actor.userId);

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_TRANSFER_CREATED",
      module: "caisse",
      targetType: "CashTransfer",
      targetId: tr.id,
      newValues: { amount: input.amount, reference },
    });

    return tr;
  });

  void dispatchCashTransferPending(transfer);

  return transfer;
}

export async function acceptTransfer(actor: TreasuryActor, transferId: string, comment?: string | null) {
  const transfer = await prisma.cashTransfer.findUniqueOrThrow({
    where: { id: transferId },
    include: {
      destinationCashbox: true,
      sourceCashbox: { select: { name: true, reference: true } },
      createdBy: { select: { id: true } },
    },
  });

  if (transfer.status !== "PENDING_RECEPTION") throw new Error("Transfert non recevable");
  if (!canReceiveTransfer(actor, transfer)) throw new Error("Vous ne pouvez pas accepter ce transfert");

  const inRef = await nextCashMovementReference(prisma);
  const amount = toNumber(transfer.amount);

  const updated = await prisma.$transaction(async (tx) => {
    const inMovement = await tx.cashMovement.create({
      data: {
        reference: inRef,
        cashboxId: transfer.destinationCashboxId,
        type: "TRANSFER_IN",
        status: "VALIDATED",
        amount,
        direction: "IN",
        operationDate: new Date(),
        reason: transfer.reason,
        transferId: transfer.id,
        notes: comment ?? null,
        createdById: actor.userId,
        validatedById: actor.userId,
        validatedAt: new Date(),
      },
    });

    await applyValidatedMovement(
      tx,
      transfer.destinationCashboxId,
      inMovement.id,
      "IN",
      amount,
      actor.userId,
    );

    const tr = await tx.cashTransfer.update({
      where: { id: transferId },
      data: {
        status: "ACCEPTED",
        receivedAt: new Date(),
        receivedById: actor.userId,
      },
      include: {
        sourceCashbox: { select: { name: true } },
        createdBy: { select: { id: true } },
      },
    });

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_TRANSFER_ACCEPTED",
      module: "caisse",
      targetType: "CashTransfer",
      targetId: transferId,
    });

    return tr;
  });

  void dispatchCashTransferResolved(updated, "ACCEPTED");
  return updated;
}

export async function rejectTransfer(
  actor: TreasuryActor,
  transferId: string,
  rejectionReason: string,
) {
  const transfer = await prisma.cashTransfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { destinationCashbox: true, createdBy: { select: { id: true } } },
  });

  if (transfer.status !== "PENDING_RECEPTION") throw new Error("Transfert non refusable");
  if (!canReceiveTransfer(actor, transfer)) throw new Error("Vous ne pouvez pas refuser ce transfert");

  const amount = toNumber(transfer.amount);
  const revRef = await nextCashMovementReference(prisma);

  const updated = await prisma.$transaction(async (tx) => {
    const outMovement = await tx.cashMovement.findFirst({
      where: { transferId, type: "TRANSFER_OUT", status: "VALIDATED" },
    });
    if (!outMovement) throw new Error("Mouvement source introuvable");

    const reversal = await tx.cashMovement.create({
      data: {
        reference: revRef,
        cashboxId: transfer.sourceCashboxId,
        type: "REVERSAL",
        status: "VALIDATED",
        amount,
        direction: "IN",
        operationDate: new Date(),
        reason: `Refus transfert — ${rejectionReason}`,
        transferId: transfer.id,
        reversedMovementId: outMovement.id,
        createdById: actor.userId,
        validatedById: actor.userId,
        validatedAt: new Date(),
        notes: rejectionReason,
      },
    });

    await applyValidatedMovement(
      tx,
      transfer.sourceCashboxId,
      reversal.id,
      "IN",
      amount,
      actor.userId,
    );

    await tx.cashMovement.update({
      where: { id: outMovement.id },
      data: { status: "REVERSED", cancellationReason: rejectionReason },
    });

    const tr = await tx.cashTransfer.update({
      where: { id: transferId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedById: actor.userId,
        rejectionReason,
      },
      include: {
        sourceCashbox: { select: { name: true } },
        createdBy: { select: { id: true } },
      },
    });

    await createAuditLog({
      actorUserId: actor.userId,
      action: "CASH_TRANSFER_REJECTED",
      module: "caisse",
      targetType: "CashTransfer",
      targetId: transferId,
      newValues: { rejectionReason },
    });

    return tr;
  });

  void dispatchCashTransferResolved(updated, "REJECTED", rejectionReason);
  return updated;
}

export async function listTransfers(actor: TreasuryActor, status?: string) {
  const scope = cashboxListWhere(actor);
  const cashboxIds = (
    await prisma.cashbox.findMany({ where: scope, select: { id: true } })
  ).map((c) => c.id);

  return prisma.cashTransfer.findMany({
    where: {
      ...(status ? { status: status as "PENDING_RECEPTION" | "ACCEPTED" | "REJECTED" | "CANCELLED" } : {}),
      OR: [
        { sourceCashboxId: { in: cashboxIds } },
        { destinationCashboxId: { in: cashboxIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sourceCashbox: { select: { id: true, name: true, reference: true } },
      destinationCashbox: { select: { id: true, name: true, reference: true } },
      senderEmployee: { select: { firstName: true, lastName: true } },
      receiverEmployee: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getTransfer(actor: TreasuryActor, id: string) {
  const transfer = await prisma.cashTransfer.findUnique({
    where: { id },
    include: {
      sourceCashbox: true,
      destinationCashbox: true,
      movements: { orderBy: { createdAt: "asc" } },
      documents: true,
      senderEmployee: true,
      receiverEmployee: { include: { user: { select: { id: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!transfer) return null;
  await assertCashboxAccess(actor, transfer.sourceCashbox);
  return transfer;
}

export type JournalFilters = {
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  category?: string;
  q?: string;
  minAmount?: number;
  maxAmount?: number;
};

export async function getCashboxJournal(actor: TreasuryActor, cashboxId: string, filters: JournalFilters) {
  await getCashbox(actor, cashboxId);

  const where: Prisma.CashMovementWhereInput = {
    cashboxId,
    ...(filters.type ? { type: filters.type as CashMovementType } : {}),
    ...(filters.status ? { status: filters.status as CashMovementStatus } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from || filters.to
      ? {
          operationDate: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { reference: { contains: filters.q, mode: "insensitive" } },
            { reason: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.minAmount != null || filters.maxAmount != null
      ? {
          amount: {
            ...(filters.minAmount != null ? { gte: filters.minAmount } : {}),
            ...(filters.maxAmount != null ? { lte: filters.maxAmount } : {}),
          },
        }
      : {}),
  };

  const movements = await prisma.cashMovement.findMany({
    where,
    orderBy: { operationDate: "asc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      validatedBy: { select: { name: true } },
      documents: true,
    },
  });

  let runningBalance = toNumber(
    (await prisma.cashbox.findUnique({ where: { id: cashboxId }, select: { initialBalance: true } }))
      ?.initialBalance,
  );

  const rows = movements.map((m) => {
    const debit = m.direction === "OUT" ? toNumber(m.amount) : 0;
    const credit = m.direction === "IN" ? toNumber(m.amount) : 0;
    if (m.status === "VALIDATED") {
      runningBalance = m.balanceAfter != null ? toNumber(m.balanceAfter) : runningBalance + credit - debit;
    }
    return {
      ...m,
      debit,
      credit,
      runningBalance: m.status === "VALIDATED" ? runningBalance : null,
    };
  });

  const validated = rows.filter((r) => r.status === "VALIDATED");
  const totalDebit = validated.reduce((s, r) => s + r.debit, 0);
  const totalCredit = validated.reduce((s, r) => s + r.credit, 0);

  return {
    rows,
    summary: {
      totalDebit,
      totalCredit,
      openingBalance: validated[0]?.balanceBefore != null ? toNumber(validated[0].balanceBefore) : 0,
      closingBalance: validated.length
        ? toNumber(validated[validated.length - 1].balanceAfter)
        : runningBalance,
    },
  };
}

export async function getEmployeeCashboxSummary(employeeId: string) {
  const boxes = await prisma.cashbox.findMany({
    where: { employeeId, status: { not: "CLOSED" } },
    include: {
      movements: {
        where: { status: "VALIDATED" },
        orderBy: { operationDate: "desc" },
        take: 5,
      },
    },
  });

  const pendingTransfers = await prisma.cashTransfer.findMany({
    where: { receiverEmployeeId: employeeId, status: "PENDING_RECEPTION" },
    include: { sourceCashbox: { select: { name: true } } },
    take: 10,
  });

  const sentTransfers = await prisma.cashTransfer.findMany({
    where: { senderEmployeeId: employeeId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { destinationCashbox: { select: { name: true } } },
  });

  return { boxes, pendingTransfers, sentTransfers };
}
