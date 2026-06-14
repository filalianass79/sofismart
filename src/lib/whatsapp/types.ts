import type { NotificationEventType } from "@/generated/prisma/enums";

export type WhatsAppSendResult = {
  messageId: string;
  status: "SENT" | "FAILED";
  error?: string;
};

export type WhatsAppRecipient = {
  userId?: string;
  employeeId?: string;
  name?: string;
  phone: string;
};

export type SendWhatsAppNotificationParams = {
  eventType: NotificationEventType;
  recipient: WhatsAppRecipient;
  templateKey?: string;
  variables?: Record<string, string | number | undefined | null>;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  messageBody?: string;
};

export type DispatchWhatsAppPayload = Record<string, string | number | undefined | null>;

export type DispatchWhatsAppContext = {
  eventType: NotificationEventType;
  payload: DispatchWhatsAppPayload;
  userIds?: string[];
  depotId?: string;
  commercialId?: string;
  clientPhones?: string[];
};
