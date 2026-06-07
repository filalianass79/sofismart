import { prisma } from "@/lib/prisma";
import type { NotificationEventType, WhatsAppMessageStatus } from "@/generated/prisma/enums";
import { MetaWhatsAppProvider } from "./providers/meta-whatsapp.provider";
import { TwilioWhatsAppProvider } from "./providers/twilio-whatsapp.provider";
import type { WhatsAppProvider } from "./whatsapp.provider";
import { isWhatsAppEnabled, isWhatsAppTestMode } from "./whatsapp.provider";
import { isMockNotificationsEnabled } from "@/lib/app-env";
import { normalizePhone } from "./phone";

const MAX_RETRIES = 3;

function getProvider(): WhatsAppProvider {
  const p = (process.env.WHATSAPP_PROVIDER ?? "meta").toLowerCase();
  if (p === "twilio") return new TwilioWhatsAppProvider();
  return new MetaWhatsAppProvider();
}

export async function sendWhatsAppMessage(params: {
  to: string;
  message: string;
  recipientUserId?: string | null;
  recipientName?: string | null;
  eventType?: NotificationEventType;
  templateKey?: string;
}): Promise<{ id: string; ok: boolean }> {
  const phone = normalizePhone(params.to);
  if (!phone) {
    const row = await prisma.whatsAppMessage.create({
      data: {
        recipientPhone: params.to,
        recipientName: params.recipientName,
        recipientUserId: params.recipientUserId,
        eventType: params.eventType,
        templateKey: params.templateKey,
        messageBody: params.message,
        provider: process.env.WHATSAPP_PROVIDER ?? "meta",
        status: "FAILED",
        errorMessage: "Numéro invalide",
      },
    });
    return { id: row.id, ok: false };
  }

  const row = await prisma.whatsAppMessage.create({
    data: {
      recipientPhone: phone,
      recipientName: params.recipientName,
      recipientUserId: params.recipientUserId,
      eventType: params.eventType,
      templateKey: params.templateKey,
      messageBody: params.message,
      provider: process.env.WHATSAPP_PROVIDER ?? "meta",
      status: "PENDING",
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
          errorMessage: null,
        },
      });
      return { id: row.id, ok: true };
    }
    await prisma.whatsAppMessage.update({
      where: { id: row.id },
      data: { status: "FAILED", errorMessage: "WhatsApp désactivé (WHATSAPP_ENABLED=false)" },
    });
    return { id: row.id, ok: false };
  }

  try {
    const provider = getProvider();
    const result = await provider.sendTextMessage(phone, params.message);
    await prisma.whatsAppMessage.update({
      where: { id: row.id },
      data: {
        status: result.status === "SENT" ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        errorMessage: result.error ?? null,
        sentAt: result.status === "SENT" ? new Date() : null,
      },
    });
    return { id: row.id, ok: result.status === "SENT" };
  } catch (e) {
    await prisma.whatsAppMessage.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message : "Erreur envoi",
      },
    });
    return { id: row.id, ok: false };
  }
}

export async function retryWhatsAppMessage(messageId: string): Promise<{ ok: boolean }> {
  const msg = await prisma.whatsAppMessage.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error("Message introuvable");
  if (msg.retryCount >= MAX_RETRIES) throw new Error("Nombre maximum de tentatives atteint");

  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: { retryCount: { increment: 1 }, status: "PENDING", errorMessage: null },
  });

  const { ok } = await sendWhatsAppMessage({
    to: msg.recipientPhone,
    message: msg.messageBody,
    recipientUserId: msg.recipientUserId,
    recipientName: msg.recipientName,
    eventType: msg.eventType ?? undefined,
    templateKey: msg.templateKey ?? undefined,
  });

  return { ok };
}

export async function updateWhatsAppStatusFromWebhook(
  providerMessageId: string,
  status: WhatsAppMessageStatus,
) {
  const msg = await prisma.whatsAppMessage.findFirst({ where: { providerMessageId } });
  if (!msg) return;
  const data: { status: WhatsAppMessageStatus; deliveredAt?: Date; readAt?: Date } = { status };
  if (status === "DELIVERED") data.deliveredAt = new Date();
  if (status === "READ") data.readAt = new Date();
  await prisma.whatsAppMessage.update({ where: { id: msg.id }, data });
}

export function getWhatsAppProviderStatus() {
  return {
    enabled: isWhatsAppEnabled(),
    testMode: process.env.WHATSAPP_TEST_MODE === "true",
    provider: process.env.WHATSAPP_PROVIDER ?? "meta",
    configured: Boolean(
      process.env.WHATSAPP_PROVIDER === "twilio"
        ? process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        : process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
    ),
  };
}
