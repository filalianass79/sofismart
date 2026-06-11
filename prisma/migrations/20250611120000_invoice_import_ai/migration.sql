-- OCR + IA — extension import facture

CREATE TYPE "InvoiceOcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
CREATE TYPE "InvoiceAiStatus" AS ENUM ('PENDING', 'DISABLED', 'PROCESSING', 'SUCCESS', 'FAILED', 'FALLBACK_REGEX');
CREATE TYPE "InvoiceExtractionRunType" AS ENUM ('OCR', 'AI', 'REGEX');
CREATE TYPE "InvoiceExtractionRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

ALTER TYPE "ExtractedFieldStatus" ADD VALUE IF NOT EXISTS 'OCR_DETECTED';
ALTER TYPE "ExtractedFieldStatus" ADD VALUE IF NOT EXISTS 'AI_DETECTED';
ALTER TYPE "ExtractedFieldStatus" ADD VALUE IF NOT EXISTS 'NEEDS_REVIEW';
ALTER TYPE "ExtractedFieldStatus" ADD VALUE IF NOT EXISTS 'USER_CORRECTED';
ALTER TYPE "ExtractedFieldStatus" ADD VALUE IF NOT EXISTS 'VALIDATED';

ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "ocrStatus" "InvoiceOcrStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "aiStatus" "InvoiceAiStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "cleanedOcrText" TEXT;
ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "ocrJson" JSONB;
ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "aiRawResponse" TEXT;
ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "aiStructuredData" JSONB;
ALTER TABLE "InvoiceImport" ADD COLUMN IF NOT EXISTS "validationErrors" JSONB;

ALTER TABLE "InvoiceExtractedField" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'REGEX_DETECTED';

CREATE TABLE IF NOT EXISTS "InvoiceExtractionRun" (
    "id" TEXT NOT NULL,
    "invoiceImportId" TEXT NOT NULL,
    "type" "InvoiceExtractionRunType" NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "status" "InvoiceExtractionRunStatus" NOT NULL DEFAULT 'PENDING',
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCost" DECIMAL(10,6),
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceExtractionRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvoiceExtractionRun_invoiceImportId_createdAt_idx" ON "InvoiceExtractionRun"("invoiceImportId", "createdAt");

ALTER TABLE "InvoiceExtractionRun" DROP CONSTRAINT IF EXISTS "InvoiceExtractionRun_invoiceImportId_fkey";
ALTER TABLE "InvoiceExtractionRun" ADD CONSTRAINT "InvoiceExtractionRun_invoiceImportId_fkey" FOREIGN KEY ("invoiceImportId") REFERENCES "InvoiceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
