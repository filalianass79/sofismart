export type EmailAttachmentInput = {
  fileName: string;
  fileUrl: string;
  fileMimeType?: string;
  fileSize?: number;
  documentId?: string;
};

export type SendEmailParams = {
  to: string;
  toName?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachmentInput[];
  replyTo?: string;
};

export type EmailSendResult = {
  messageId: string;
  status: "SENT" | "FAILED";
  error?: string;
};

export type EmailDispatchPayload = Record<string, string | number | undefined | null>;

export type EmailDispatchContext = {
  eventType: import("@/generated/prisma/enums").NotificationEventType;
  payload: EmailDispatchPayload;
  userIds?: string[];
  clientEmails?: string[];
  supplierEmails?: string[];
  manualEmails?: string[];
  depotId?: string;
  attachments?: EmailAttachmentInput[];
  emailType?: import("@/generated/prisma/enums").EmailType;
};
