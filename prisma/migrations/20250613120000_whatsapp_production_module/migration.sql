-- WhatsApp production module: Employee fields, WhatsAppMessage enhancements, WhatsAppTemplate

-- PreferredNotificationChannel enum
CREATE TYPE "PreferredNotificationChannel" AS ENUM ('INTERNAL', 'WHATSAPP', 'EMAIL', 'ALL');

-- NotificationEventType: PURCHASE_VALIDATION_REQUEST
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PURCHASE_VALIDATION_REQUEST';

-- WhatsAppMessageStatus: new values
ALTER TYPE "WhatsAppMessageStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
ALTER TYPE "WhatsAppMessageStatus" ADD VALUE IF NOT EXISTS 'SENDING';
ALTER TYPE "WhatsAppMessageStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Employee WhatsApp fields
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "whatsappPhone" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "whatsappConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "preferredNotificationChannel" "PreferredNotificationChannel" NOT NULL DEFAULT 'ALL';

-- WhatsAppMessage enhancements
ALTER TABLE "WhatsAppMessage" ADD COLUMN IF NOT EXISTS "recipientEmployeeId" TEXT;
ALTER TABLE "WhatsAppMessage" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "WhatsAppMessage" ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3);

ALTER TABLE "WhatsAppMessage" DROP CONSTRAINT IF EXISTS "WhatsAppMessage_recipientEmployeeId_fkey";
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_recipientEmployeeId_fkey"
  FOREIGN KEY ("recipientEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WhatsAppMessage_recipientEmployeeId_idx" ON "WhatsAppMessage"("recipientEmployeeId");

-- NotificationSetting flags
ALTER TABLE "NotificationSetting" ADD COLUMN IF NOT EXISTS "sendToCommercial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationSetting" ADD COLUMN IF NOT EXISTS "sendToWarehouse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationSetting" ADD COLUMN IF NOT EXISTS "sendToManager" BOOLEAN NOT NULL DEFAULT false;

-- WhatsAppTemplate
CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "eventType" "NotificationEventType" NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'fr',
  "metaTemplateName" TEXT,
  "body" TEXT NOT NULL,
  "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppTemplate_key_key" ON "WhatsAppTemplate"("key");
CREATE INDEX IF NOT EXISTS "WhatsAppTemplate_eventType_idx" ON "WhatsAppTemplate"("eventType");
