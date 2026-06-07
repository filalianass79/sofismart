-- Email notifications module

CREATE TYPE "EmailMessageStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'SPAM', 'CANCELLED');
CREATE TYPE "EmailType" AS ENUM ('TRANSACTIONAL', 'NOTIFICATION', 'REMINDER', 'DOCUMENT', 'SECURITY', 'SYSTEM');

ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'EMAIL';

ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'SALES_INVOICE_GENERATED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'SALES_INVOICE_SENT_TO_CLIENT';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PURCHASE_INVOICE_IMPORTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PASSWORD_CHANGED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'ACCOUNT_BLOCKED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'ACTION_REQUIRES_VALIDATION';

CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientClientId" TEXT,
    "recipientSupplierId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventType" "NotificationEventType",
    "emailType" "EmailType" NOT NULL DEFAULT 'TRANSACTIONAL',
    "templateKey" TEXT,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "providerMessageId" TEXT,
    "status" "EmailMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailAttachment" (
    "id" TEXT NOT NULL,
    "emailMessageId" TEXT NOT NULL,
    "documentId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "subjectTemplate" TEXT NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "textTemplate" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailNotificationSetting" (
    "id" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recipientRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipientUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sendToClient" BOOLEAN NOT NULL DEFAULT false,
    "sendToSupplier" BOOLEAN NOT NULL DEFAULT false,
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachDocuments" BOOLEAN NOT NULL DEFAULT false,
    "attachmentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailNotificationSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserEmailPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alternativeEmail" TEXT,
    "disabledEventTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserEmailPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");
CREATE INDEX "EmailTemplate_eventType_idx" ON "EmailTemplate"("eventType");
CREATE UNIQUE INDEX "EmailNotificationSetting_eventType_key" ON "EmailNotificationSetting"("eventType");
CREATE UNIQUE INDEX "UserEmailPreference_userId_key" ON "UserEmailPreference"("userId");
CREATE INDEX "EmailMessage_status_createdAt_idx" ON "EmailMessage"("status", "createdAt");
CREATE INDEX "EmailMessage_recipientUserId_idx" ON "EmailMessage"("recipientUserId");
CREATE INDEX "EmailMessage_recipientEmail_idx" ON "EmailMessage"("recipientEmail");
CREATE INDEX "EmailMessage_eventType_idx" ON "EmailMessage"("eventType");
CREATE INDEX "EmailMessage_providerMessageId_idx" ON "EmailMessage"("providerMessageId");
CREATE INDEX "EmailAttachment_emailMessageId_idx" ON "EmailAttachment"("emailMessageId");

ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserEmailPreference" ADD CONSTRAINT "UserEmailPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
