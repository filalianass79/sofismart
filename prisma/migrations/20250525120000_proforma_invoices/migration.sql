-- CreateEnum
CREATE TYPE "ProformaStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'PRINTED', 'CONVERTED_TO_SALE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProformaHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'GENERATED', 'PREVIEWED', 'PRINTED', 'DOWNLOADED', 'SENT', 'CANCELLED', 'CONVERTED_TO_SALE', 'EXPIRED');

-- CreateTable
CREATE TABLE "ProformaInvoice" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "clientId" TEXT,
    "temporaryClientData" JSONB,
    "vehicleId" TEXT NOT NULL,
    "commercialId" TEXT NOT NULL,
    "proformaDate" TIMESTAMP(3) NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "priceHT" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accessoryFees" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalTTC" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "observations" TEXT,
    "status" "ProformaStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3),
    "printedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "convertedSaleId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaLine" (
    "id" TEXT NOT NULL,
    "proformaInvoiceId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPriceHT" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalHT" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalTTC" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaHistory" (
    "id" TEXT NOT NULL,
    "proformaInvoiceId" TEXT NOT NULL,
    "action" "ProformaHistoryAction" NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProformaInvoice_reference_key" ON "ProformaInvoice"("reference");
CREATE UNIQUE INDEX "ProformaInvoice_convertedSaleId_key" ON "ProformaInvoice"("convertedSaleId");
CREATE INDEX "ProformaInvoice_status_proformaDate_idx" ON "ProformaInvoice"("status", "proformaDate");
CREATE INDEX "ProformaInvoice_commercialId_idx" ON "ProformaInvoice"("commercialId");
CREATE INDEX "ProformaInvoice_clientId_idx" ON "ProformaInvoice"("clientId");
CREATE INDEX "ProformaInvoice_vehicleId_idx" ON "ProformaInvoice"("vehicleId");
CREATE INDEX "ProformaInvoice_validityDate_idx" ON "ProformaInvoice"("validityDate");
CREATE INDEX "ProformaLine_proformaInvoiceId_idx" ON "ProformaLine"("proformaInvoiceId");
CREATE INDEX "ProformaHistory_proformaInvoiceId_createdAt_idx" ON "ProformaHistory"("proformaInvoiceId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_convertedSaleId_fkey" FOREIGN KEY ("convertedSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProformaLine" ADD CONSTRAINT "ProformaLine_proformaInvoiceId_fkey" FOREIGN KEY ("proformaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProformaHistory" ADD CONSTRAINT "ProformaHistory_proformaInvoiceId_fkey" FOREIGN KEY ("proformaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProformaHistory" ADD CONSTRAINT "ProformaHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
