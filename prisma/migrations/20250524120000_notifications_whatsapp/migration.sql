-- Notifications & WhatsApp module

CREATE TYPE "AppNotificationCategory" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ACTION_REQUIRED');
CREATE TYPE "NotificationEventType" AS ENUM (
  'SALE_VALIDATED', 'SALE_VALIDATION_REQUEST', 'EXIT_VOUCHER_GENERATED', 'EXIT_VOUCHER_SENT',
  'DELIVERY_NOTE_GENERATED', 'DELIVERY_CONFIRMED', 'SIGNED_DELIVERY_UPLOADED', 'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE', 'PURCHASE_VALIDATED', 'VEHICLE_STOCK_ENTRY', 'VEHICLE_TRANSFERRED',
  'USER_CREATED', 'PASSWORD_RESET', 'DOCUMENT_UPLOADED'
);
CREATE TYPE "NotificationChannel" AS ENUM ('INTERNAL', 'WHATSAPP');
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ');

ALTER TYPE "AppNotificationStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "AppNotification" ADD COLUMN IF NOT EXISTS "category" "AppNotificationCategory" NOT NULL DEFAULT 'INFO';
ALTER TABLE "AppNotification" ADD COLUMN IF NOT EXISTS "module" TEXT;
ALTER TABLE "AppNotification" ADD COLUMN IF NOT EXISTS "eventType" "NotificationEventType";
ALTER TABLE "AppNotification" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "AppNotification" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "AppNotification_userId_eventType_idx" ON "AppNotification"("userId", "eventType");

CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "recipientName" TEXT,
    "eventType" "NotificationEventType",
    "templateKey" TEXT,
    "messageBody" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'meta',
    "providerMessageId" TEXT,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "internalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recipientRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipientUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sendToClient" BOOLEAN NOT NULL DEFAULT false,
    "sendToEmployee" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserNotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "internalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "phoneOverride" TEXT,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationTemplate_key_channel_key" ON "NotificationTemplate"("key", "channel");
CREATE INDEX "NotificationTemplate_eventType_channel_idx" ON "NotificationTemplate"("eventType", "channel");
CREATE UNIQUE INDEX "NotificationSetting_eventType_key" ON "NotificationSetting"("eventType");
CREATE UNIQUE INDEX "UserNotificationPreference_userId_key" ON "UserNotificationPreference"("userId");
CREATE INDEX "WhatsAppMessage_status_createdAt_idx" ON "WhatsAppMessage"("status", "createdAt");
CREATE INDEX "WhatsAppMessage_recipientUserId_idx" ON "WhatsAppMessage"("recipientUserId");
CREATE INDEX "WhatsAppMessage_providerMessageId_idx" ON "WhatsAppMessage"("providerMessageId");

ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
