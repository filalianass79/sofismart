import { prisma } from "@/lib/prisma";
import type { EmailType, NotificationEventType } from "@/generated/prisma/enums";
import { sendEmailViaProvider } from "./email.service";
import type { EmailAttachmentInput } from "./types";

const MAX_RETRIES = 3;

export async function sendTransactionalEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  recipientUserId?: string;
  recipientClientId?: string;
  eventType?: NotificationEventType;
  templateKey?: string;
  emailType?: EmailType;
  attachments?: EmailAttachmentInput[];
}): Promise<{ id: string; ok: boolean; error?: string }> {
  const row = await prisma.emailMessage.create({
    data: {
      recipientEmail: params.to.toLowerCase(),
      recipientName: params.toName,
      recipientUserId: params.recipientUserId,
      recipientClientId: params.recipientClientId,
      cc: params.cc ?? [],
      bcc: params.bcc ?? [],
      eventType: params.eventType,
      emailType: params.emailType ?? "TRANSACTIONAL",
      templateKey: params.templateKey,
      subject: params.subject,
      htmlBody: params.html,
      textBody: params.text,
      provider: process.env.EMAIL_PROVIDER ?? "smtp",
      status: "SENDING",
    },
  });

  if (params.attachments?.length) {
    await prisma.emailAttachment.createMany({
      data: params.attachments.map((a) => ({
        emailMessageId: row.id,
        documentId: a.documentId,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileMimeType: a.fileMimeType,
        fileSize: a.fileSize,
      })),
    });
  }

  const result = await sendEmailViaProvider({
    to: params.to,
    toName: params.toName,
    subject: params.subject,
    html: params.html,
    text: params.text,
    cc: params.cc,
    bcc: params.bcc,
    attachments: params.attachments,
  });

  await prisma.emailMessage.update({
    where: { id: row.id },
    data: {
      status: result.status === "SENT" ? "SENT" : "FAILED",
      providerMessageId: result.messageId || null,
      errorMessage: result.error ?? null,
      sentAt: result.status === "SENT" ? new Date() : null,
    },
  });

  return {
    id: row.id,
    ok: result.status === "SENT",
    error: result.error,
  };
}

export async function retryEmailMessage(messageId: string): Promise<{ ok: boolean }> {
  const msg = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    include: { attachments: true },
  });
  if (!msg) throw new Error("Email introuvable");
  if (msg.retryCount >= MAX_RETRIES) throw new Error("Nombre max de tentatives atteint");

  await prisma.emailMessage.update({
    where: { id: messageId },
    data: { retryCount: { increment: 1 }, status: "SENDING", errorMessage: null },
  });

  const result = await sendEmailViaProvider({
    to: msg.recipientEmail,
    toName: msg.recipientName ?? undefined,
    subject: msg.subject,
    html: msg.htmlBody,
    text: msg.textBody ?? undefined,
    cc: msg.cc,
    bcc: msg.bcc,
    attachments: msg.attachments.map((a) => ({
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileMimeType: a.fileMimeType ?? undefined,
      fileSize: a.fileSize ?? undefined,
    })),
  });

  await prisma.emailMessage.update({
    where: { id: messageId },
    data: {
      status: result.status === "SENT" ? "SENT" : "FAILED",
      providerMessageId: result.messageId || null,
      errorMessage: result.error ?? null,
      sentAt: result.status === "SENT" ? new Date() : null,
    },
  });

  return { ok: result.status === "SENT" };
}

export { maskEmail } from "./email-utils";
