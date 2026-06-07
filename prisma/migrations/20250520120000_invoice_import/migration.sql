-- Import facture achat (OCR)
CREATE TYPE "InvoiceImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'EXTRACTED', 'FAILED', 'DRAFT_SAVED', 'VALIDATED');
CREATE TYPE "InvoiceExtractionStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL', 'FAILED');
CREATE TYPE "ExtractedFieldStatus" AS ENUM ('DETECTED', 'VERIFIED', 'CORRECTED', 'IGNORED');
CREATE TYPE "InvoiceLineType" AS ENUM ('VEHICLE', 'ACCESSORY', 'FEE', 'DISCOUNT', 'OTHER');

CREATE TABLE "InvoiceImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "status" "InvoiceImportStatus" NOT NULL DEFAULT 'PENDING',
    "extractionStatus" "InvoiceExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "rawOcrText" TEXT,
    "structuredData" JSONB,
    "confidenceScore" DECIMAL(5,4),
    "purchaseId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvoiceImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceExtractedField" (
    "id" TEXT NOT NULL,
    "invoiceImportId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "extractedValue" TEXT,
    "correctedValue" TEXT,
    "confidence" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "sourceText" TEXT,
    "boundingBox" JSONB,
    "status" "ExtractedFieldStatus" NOT NULL DEFAULT 'DETECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvoiceExtractedField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceImportId" TEXT NOT NULL,
    "designation" TEXT,
    "quantity" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "unitPriceHT" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalHT" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalTTC" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineType" "InvoiceLineType" NOT NULL DEFAULT 'OTHER',
    "confidence" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document" ADD COLUMN "invoiceImportId" TEXT;
ALTER TABLE "Document" ADD COLUMN "ocrJsonUrl" TEXT;
ALTER TABLE "Document" ADD COLUMN "extractedData" JSONB;

CREATE INDEX "InvoiceImport_status_createdAt_idx" ON "InvoiceImport"("status", "createdAt");
CREATE INDEX "InvoiceImport_uploadedById_idx" ON "InvoiceImport"("uploadedById");
CREATE INDEX "InvoiceExtractedField_invoiceImportId_fieldKey_idx" ON "InvoiceExtractedField"("invoiceImportId", "fieldKey");
CREATE INDEX "InvoiceLineItem_invoiceImportId_idx" ON "InvoiceLineItem"("invoiceImportId");

ALTER TABLE "InvoiceImport" ADD CONSTRAINT "InvoiceImport_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceImport" ADD CONSTRAINT "InvoiceImport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceExtractedField" ADD CONSTRAINT "InvoiceExtractedField_invoiceImportId_fkey" FOREIGN KEY ("invoiceImportId") REFERENCES "InvoiceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceImportId_fkey" FOREIGN KEY ("invoiceImportId") REFERENCES "InvoiceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceImportId_fkey" FOREIGN KEY ("invoiceImportId") REFERENCES "InvoiceImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
