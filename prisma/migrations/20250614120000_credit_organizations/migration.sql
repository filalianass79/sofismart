-- CreateTable
CREATE TABLE "CreditOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditOrganization_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "creditOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "ProformaInvoice" ADD COLUMN "creditOrganizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CreditOrganization_name_key" ON "CreditOrganization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CreditOrganization_code_key" ON "CreditOrganization"("code");

-- CreateIndex
CREATE INDEX "CreditOrganization_isActive_idx" ON "CreditOrganization"("isActive");

-- CreateIndex
CREATE INDEX "Sale_creditOrganizationId_idx" ON "Sale"("creditOrganizationId");

-- CreateIndex
CREATE INDEX "ProformaInvoice_creditOrganizationId_idx" ON "ProformaInvoice"("creditOrganizationId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_creditOrganizationId_fkey" FOREIGN KEY ("creditOrganizationId") REFERENCES "CreditOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_creditOrganizationId_fkey" FOREIGN KEY ("creditOrganizationId") REFERENCES "CreditOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
