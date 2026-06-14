import { prisma } from "@/lib/prisma";
import type { NotificationEventType, WhatsAppMessageStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { isMockNotificationsEnabled } from "@/lib/app-env";
import { normalizePhone, maskPhone } from "@/lib/notifications/phone";
import { MetaWhatsAppProvider } from "./meta-whatsapp.provider";
import { TwilioWhatsAppProvider } from "@/lib/notifications/providers/twilio-whatsapp.provider";
import {
  getWhatsAppProviderName,
  isWhatsAppEnabled,
  isWhatsAppTestMode,
  whatsAppMaxRetries,
  whatsAppRetryDelaySeconds,
  type WhatsAppProvider,
} from "./whatsapp.provider";
import { renderWhatsAppTemplateBody } from "./whatsapp-template.service";
import { enqueueWhatsAppJob, scheduleWhatsAppRetry } from "./whatsapp-queue";
import type { SendWhatsAppNotificationParams } from "./types";

function getProvider(): WhatsAppProvider {
  if (getWhatsAppProviderName() === "twilio") return new TwilioWhatsAppProvider();
  return new MetaWhatsAppProvider();
}

async function deliverMessage(
  messageId: string,
  phone: string,
  body: string,
  metaTemplateName: string | null | undefined,
  language: string,
  templateParams: string[],
): Promise<boolean> {
  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { status: "SENDING" },
  });

  try {
    const provider = getProvider();
    const result =
      metaTemplateName && "sendTemplateMessage" in provider
        ? await provider.sendTemplateMessage(phone, metaTemplateName, language, templateParams)
        : await provider.sendTextMessage(phone, body);

    await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: result.status === "SENT" ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        errorMessage: result.error ?? null,
        sentAt: result.status === "SENT" ? new Date() : null,
        failedAt: result.status === "FAILED" ? new Date() : null,
      },
    });
    return result.status === "SENT";
  } catch (e) {
    await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message : "Erreur envoi",
        failedAt: new Date(),
      },
    });
    return false;
  }
}

/**
 * Envoie une notification WhatsApp production (Meta Cloud API / fallback texte).
 * Ne lève jamais d'exception — journalise et retourne { ok, id }.
 */
export async function sendWhatsAppNotification(
  params: SendWhatsAppNotificationParams,
): Promise<{ id: string; ok: boolean }> {
  const phone = normalizePhone(params.recipient.phone);
  const provider = getWhatsAppProviderName();

  const rendered = params.messageBody
    ? {
        body: params.messageBody,
        templateKey: params.templateKey ?? "custom",
        metaTemplateName: null as string | null,
        language: "fr",
        orderedParams: [] as string[],
      }
    : await renderWhatsAppTemplateBody(params.templateKey ?? "", {
        ...params.variables,
        eventType: params.eventType,
      });

  const messageBody = rendered?.body ?? params.messageBody ?? "";
  const templateKey = rendered?.templateKey ?? params.templateKey ?? null;

  if (!phone) {
    const row = await prisma.whatsAppMessage.create({
      data: {
        recipientPhone: maskPhone(params.recipient.phone),
        recipientName: params.recipient.name,
        recipientUserId: params.recipient.userId,
        recipientEmployeeId: params.recipient.employeeId,
        eventType: params.eventType,
        templateKey,
        messageBody: messageBody || "—",
        provider,
        status: "FAILED",
        errorMessage: "Numéro WhatsApp invalide",
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return { id: row.id, ok: false };
  }

  const row = await prisma.whatsAppMessage.create({
    data: {
      recipientPhone: phone,
      recipientName: params.recipient.name,
      recipientUserId: params.recipient.userId,
      recipientEmployeeId: params.recipient.employeeId,
      eventType: params.eventType,
      templateKey,
      messageBody: messageBody || "—",
      provider,
      status: "QUEUED",
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  if (!isWhatsAppEnabled()) {
    const simulate =
      isWhatsAppTestMode() || isMockNotificationsEnabled() || process.env.ENABLE_MOCK_NOTIFICATIONS === "true";
    if (simulate) {
      await prisma.whatsAppMessage.update({
        where: { id: row.id },
        data: {
          status: "SENT",
          providerMessageId: `simulated-${row.id}`,
          sentAt: new Date(),
        },
      });
      return { id: row.id, ok: true };
    }
    await prisma.whatsAppMessage.update({
      where: { id: row.id },
      data: { status: "FAILED", errorMessage: "WhatsApp désactivé", failedAt: new Date() },
    });
    return { id: row.id, ok: false };
  }

  enqueueWhatsAppJob(async () => {
    const ok = await deliverMessage(
      row.id,
      phone,
      messageBody,
      rendered?.metaTemplateName,
      rendered?.language ?? "fr",
      rendered?.orderedParams ?? [],
    );
    if (!ok) {
      const msg = await prisma.whatsAppMessage.findUnique({ where: { id: row.id } });
      if (msg && msg.retryCount < whatsAppMaxRetries()) {
        await prisma.whatsAppMessage.update({
          where: { id: row.id },
          data: { retryCount: { increment: 1 }, status: "QUEUED" },
        });
        scheduleWhatsAppRetry(async () => {
          await deliverMessage(
            row.id,
            phone,
            messageBody,
            rendered?.metaTemplateName,
            rendered?.language ?? "fr",
            rendered?.orderedParams ?? [],
          );
        }, whatsAppRetryDelaySeconds());
      }
    }
  });

  return { id: row.id, ok: true };
}

/** @deprecated Utiliser sendWhatsAppNotification — compatibilité legacy */
export async function sendWhatsAppMessage(params: {
  to: string;
  message: string;
  recipientUserId?: string | null;
  recipientName?: string | null;
  eventType?: NotificationEventType;
  templateKey?: string;
}): Promise<{ id: string; ok: boolean }> {
  return sendWhatsAppNotification({
    eventType: params.eventType ?? "ACTION_REQUIRES_VALIDATION",
    recipient: {
      phone: params.to,
      userId: params.recipientUserId ?? undefined,
      name: params.recipientName ?? undefined,
    },
    templateKey: params.templateKey,
    messageBody: params.message,
  });
}

export async function retryWhatsAppMessage(messageId: string): Promise<{ ok: boolean }> {
  const msg = await prisma.whatsAppMessage.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error("Message introuvable");
  if (msg.retryCount >= whatsAppMaxRetries()) throw new Error("Nombre maximum de tentatives atteint");

  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { retryCount: { increment: 1 }, status: "QUEUED", errorMessage: null, failedAt: null },
  });

  const tpl = msg.templateKey ? await prisma.whatsAppTemplate.findUnique({ where: { key: msg.templateKey } }) : null;

  const ok = await deliverMessage(
    messageId,
    msg.recipientPhone,
    msg.messageBody,
    tpl?.metaTemplateName,
    tpl?.language ?? "fr",
    tpl?.variables.map(() => "") ?? [],
  );

  return { ok };
}

export async function updateWhatsAppStatusFromWebhook(
  providerMessageId: string,
  status: WhatsAppMessageStatus,
  errorMessage?: string,
) {
  const msg = await prisma.whatsAppMessage.findFirst({ where: { providerMessageId } });
  if (!msg) return;
  const data: {
    status: WhatsAppMessageStatus;
    deliveredAt?: Date;
    readAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
  } = { status };
  if (status === "DELIVERED") data.deliveredAt = new Date();
  if (status === "READ") data.readAt = new Date();
  if (status === "FAILED") {
    data.failedAt = new Date();
    if (errorMessage) data.errorMessage = errorMessage;
  }
  await prisma.whatsAppMessage.update({ where: { id: msg.id }, data });
}

export function getWhatsAppProviderStatus() {
  return {
    enabled: isWhatsAppEnabled(),
    testMode: isWhatsAppTestMode(),
    provider: getWhatsAppProviderName(),
    maxRetries: whatsAppMaxRetries(),
    configured: Boolean(
      getWhatsAppProviderName() === "twilio"
        ? process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        : process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
    ),
  };
}

export async function listWhatsAppMessages(opts: {
  status?: WhatsAppMessageStatus;
  take?: number;
  skip?: number;
}) {
  return prisma.whatsAppMessage.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.take ?? 50, 200),
    skip: opts.skip ?? 0,
  });
}
