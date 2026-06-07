
export type NotificationPayload = Record<string, string | number | undefined | null>;

export type EmailAttachmentRef = {
  fileName: string;
  fileUrl: string;
  fileMimeType?: string;
  fileSize?: number;
  documentId?: string;
};

export type DispatchContext = {
  eventType: import("@/generated/prisma/enums").NotificationEventType;
  payload: NotificationPayload;
  userIds?: string[];
  clientPhones?: string[];
  clientEmails?: string[];
  depotId?: string;
  module?: string;
  actionUrl?: string;
  category?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "ACTION_REQUIRED";
  metadata?: Record<string, unknown>;
  attachments?: EmailAttachmentRef[];
};

export type WhatsAppSendResult = {
  messageId: string;
  status: "SENT" | "PENDING" | "FAILED";
  error?: string;
};
