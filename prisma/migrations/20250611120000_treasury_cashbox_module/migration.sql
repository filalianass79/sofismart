-- Treasury / Cashbox module

-- NotificationEventType extensions
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'CASH_TRANSFER_PENDING';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'CASH_TRANSFER_ACCEPTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'CASH_TRANSFER_REJECTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'CASH_MOVEMENT_PENDING';

-- Enums
CREATE TYPE "CashboxType" AS ENUM ('EMPLOYEE', 'DEPOT', 'MAIN', 'TEMPORARY');
CREATE TYPE "CashboxStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'CLOSED');
CREATE TYPE "CashMovementType" AS ENUM ('CREDIT', 'DEBIT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'REVERSAL');
CREATE TYPE "CashMovementStatus" AS ENUM ('DRAFT', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'CANCELLED', 'REVERSED');
CREATE TYPE "CashMovementDirection" AS ENUM ('IN', 'OUT');
CREATE TYPE "CashTransferStatus" AS ENUM ('PENDING_RECEPTION', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "CashDocumentType" AS ENUM ('RECEIPT', 'INVOICE', 'VOUCHER', 'PHOTO', 'OTHER');
CREATE TYPE "CashCategoryType" AS ENUM ('CREDIT', 'DEBIT', 'BOTH');

CREATE TABLE "Cashbox" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CashboxType" NOT NULL DEFAULT 'EMPLOYEE',
    "employeeId" TEXT,
    "depotId" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'MAD',
    "initialBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "authorizedLimit" DECIMAL(14,2),
    "status" "CashboxStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cashbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashTransfer" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "transferCode" TEXT NOT NULL,
    "sourceCashboxId" TEXT NOT NULL,
    "destinationCashboxId" TEXT NOT NULL,
    "senderEmployeeId" TEXT,
    "receiverEmployeeId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "CashTransferStatus" NOT NULL DEFAULT 'PENDING_RECEPTION',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdById" TEXT,
    "receivedById" TEXT,
    "rejectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "cashboxId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "status" "CashMovementStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "amount" DECIMAL(14,2) NOT NULL,
    "direction" "CashMovementDirection" NOT NULL,
    "operationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "reason" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "externalReference" TEXT,
    "relatedSaleId" TEXT,
    "relatedPurchaseId" TEXT,
    "relatedPaymentId" TEXT,
    "transferId" TEXT,
    "balanceBefore" DECIMAL(14,2),
    "balanceAfter" DECIMAL(14,2),
    "createdById" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "reversedMovementId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashDocument" (
    "id" TEXT NOT NULL,
    "cashboxId" TEXT,
    "movementId" TEXT,
    "transferId" TEXT,
    "type" "CashDocumentType" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CashCategoryType" NOT NULL DEFAULT 'BOTH',
    "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cashbox_reference_key" ON "Cashbox"("reference");
CREATE INDEX "Cashbox_status_idx" ON "Cashbox"("status");
CREATE INDEX "Cashbox_employeeId_idx" ON "Cashbox"("employeeId");
CREATE INDEX "Cashbox_depotId_idx" ON "Cashbox"("depotId");
CREATE INDEX "Cashbox_type_idx" ON "Cashbox"("type");

CREATE UNIQUE INDEX "CashTransfer_reference_key" ON "CashTransfer"("reference");
CREATE UNIQUE INDEX "CashTransfer_transferCode_key" ON "CashTransfer"("transferCode");
CREATE INDEX "CashTransfer_status_idx" ON "CashTransfer"("status");
CREATE INDEX "CashTransfer_sourceCashboxId_idx" ON "CashTransfer"("sourceCashboxId");
CREATE INDEX "CashTransfer_destinationCashboxId_idx" ON "CashTransfer"("destinationCashboxId");
CREATE INDEX "CashTransfer_receiverEmployeeId_idx" ON "CashTransfer"("receiverEmployeeId");

CREATE UNIQUE INDEX "CashMovement_reference_key" ON "CashMovement"("reference");
CREATE INDEX "CashMovement_cashboxId_operationDate_idx" ON "CashMovement"("cashboxId", "operationDate");
CREATE INDEX "CashMovement_status_idx" ON "CashMovement"("status");
CREATE INDEX "CashMovement_transferId_idx" ON "CashMovement"("transferId");
CREATE INDEX "CashMovement_relatedPaymentId_idx" ON "CashMovement"("relatedPaymentId");

CREATE INDEX "CashDocument_movementId_idx" ON "CashDocument"("movementId");
CREATE INDEX "CashDocument_transferId_idx" ON "CashDocument"("transferId");

CREATE UNIQUE INDEX "CashCategory_name_type_key" ON "CashCategory"("name", "type");

ALTER TABLE "Cashbox" ADD CONSTRAINT "Cashbox_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Cashbox" ADD CONSTRAINT "Cashbox_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Cashbox" ADD CONSTRAINT "Cashbox_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_sourceCashboxId_fkey" FOREIGN KEY ("sourceCashboxId") REFERENCES "Cashbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_destinationCashboxId_fkey" FOREIGN KEY ("destinationCashboxId") REFERENCES "Cashbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_senderEmployeeId_fkey" FOREIGN KEY ("senderEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_receiverEmployeeId_fkey" FOREIGN KEY ("receiverEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashTransfer" ADD CONSTRAINT "CashTransfer_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashboxId_fkey" FOREIGN KEY ("cashboxId") REFERENCES "Cashbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "CashTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashDocument" ADD CONSTRAINT "CashDocument_cashboxId_fkey" FOREIGN KEY ("cashboxId") REFERENCES "Cashbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashDocument" ADD CONSTRAINT "CashDocument_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "CashMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashDocument" ADD CONSTRAINT "CashDocument_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "CashTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashDocument" ADD CONSTRAINT "CashDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
