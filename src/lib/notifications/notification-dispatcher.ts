import { prisma } from "@/lib/prisma";
import type { DispatchContext, NotificationPayload } from "./types";
import { appBaseUrl, renderTemplate } from "./template-utils";
import {
  createInternalNotificationsBulk,
  getTemplateForEvent,
} from "./notification.service";
import { sendWhatsAppMessage } from "./whatsapp.service";
import { findUsersByRoleCodes, findWarehouseUsersForDepot, resolveUserPhone } from "./recipients";
import { normalizePhone } from "./phone";
import { enqueueNotificationJob } from "./notification-queue";
import { dispatchEmailEvent, buildEmailContextFromNotification } from "./email/email-dispatcher";

function enrichPayload(payload: NotificationPayload): NotificationPayload {
  const base = appBaseUrl();
  return {
    ...payload,
    actionUrl: payload.actionUrl
      ? String(payload.actionUrl).startsWith("http")
        ? String(payload.actionUrl)
        : `${base}${payload.actionUrl}`
      : payload.actionUrl,
    documentUrl: payload.documentUrl
      ? String(payload.documentUrl).startsWith("http")
        ? String(payload.documentUrl)
        : `${base}${payload.documentUrl}`
      : payload.documentUrl,
  };
}

async function resolveRecipientUserIds(ctx: DispatchContext): Promise<string[]> {
  const setting = await prisma.notificationSetting.findUnique({
    where: { eventType: ctx.eventType },
  });
  const ids = new Set<string>(ctx.userIds ?? []);

  if (setting?.recipientUserIds?.length) {
    setting.recipientUserIds.forEach((id) => ids.add(id));
  }

  if (setting?.recipientRoles?.length) {
    const users = await findUsersByRoleCodes(setting.recipientRoles);
    users.forEach((u) => ids.add(u.id));
  }

  if (ctx.depotId) {
    const warehouse = await findWarehouseUsersForDepot(ctx.depotId);
    warehouse.forEach((u) => ids.add(u.id));
  }

  return [...ids];
}

async function dispatchInternal(ctx: DispatchContext, userIds: string[], payload: NotificationPayload) {
  const setting = await prisma.notificationSetting.findUnique({
    where: { eventType: ctx.eventType },
  });
  if (setting && !setting.internalEnabled) return;
  const prefsRows = await prisma.userNotificationPreference.findMany({
    where: { userId: { in: userIds } },
  });
  const prefsMap = new Map(prefsRows.map((p) => [p.userId, p]));
  const enabledIds = userIds.filter((id) => prefsMap.get(id)?.internalEnabled !== false);
  if (!enabledIds.length) return;

  const template = await getTemplateForEvent(ctx.eventType, "INTERNAL");
  const title =
    template?.subject?.trim() ||
    (payload.title as string) ||
    ctx.eventType.replace(/_/g, " ");
  const message = template
    ? renderTemplate(template.body, payload)
    : (payload.message as string) || title;

  await createInternalNotificationsBulk(enabledIds, {
    title,
    message,
    link: ctx.actionUrl,
    category: ctx.category ?? "INFO",
    module: ctx.module,
    eventType: ctx.eventType,
    metadata: ctx.metadata,
  });
}

async function dispatchWhatsApp(
  ctx: DispatchContext,
  userIds: string[],
  payload: NotificationPayload,
) {
  const setting = await prisma.notificationSetting.findUnique({
    where: { eventType: ctx.eventType },
  });
  if (setting && !setting.whatsappEnabled) return;

  const template = await getTemplateForEvent(ctx.eventType, "WHATSAPP");
  const body = template
    ? renderTemplate(template.body, payload)
    : (payload.whatsappMessage as string) || (payload.message as string);
  if (!body?.trim()) return;

  if (setting?.sendToEmployee !== false) {
    for (const userId of userIds) {
      const prefs = await prisma.userNotificationPreference.findUnique({ where: { userId } });
      if (prefs && (!prefs.whatsappEnabled || !prefs.whatsappOptIn)) continue;
      const phone = await resolveUserPhone(userId);
      if (!phone) continue;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await sendWhatsAppMessage({
        to: phone,
        message: body,
        recipientUserId: userId,
        recipientName: user?.name,
        eventType: ctx.eventType,
        templateKey: template?.key,
      });
    }
  }

  if (setting?.sendToClient && ctx.clientPhones?.length) {
    for (const raw of ctx.clientPhones) {
      const phone = normalizePhone(raw);
      if (!phone) continue;
      await sendWhatsAppMessage({
        to: phone,
        message: body,
        eventType: ctx.eventType,
        templateKey: template?.key,
      });
    }
  }
}

export async function dispatchNotificationEvent(ctx: DispatchContext): Promise<void> {
  const setting = await prisma.notificationSetting.findUnique({
    where: { eventType: ctx.eventType },
  });
  if (setting && !setting.isActive) return;

  const payload = enrichPayload(ctx.payload);
  const userIds = await resolveRecipientUserIds(ctx);

  await dispatchInternal(ctx, userIds, payload);
  await dispatchWhatsApp(ctx, userIds, payload);
  await dispatchEmailEvent(buildEmailContextFromNotification(ctx));
}

/** Non bloquant pour les transactions métier */
export function dispatchNotificationEventAsync(ctx: DispatchContext) {
  enqueueNotificationJob(() => dispatchNotificationEvent(ctx));
}

export function dispatchSaleValidated(payload: NotificationPayload & { depotId?: string; userIds?: string[] }) {
  dispatchNotificationEventAsync({
    eventType: "SALE_VALIDATED",
    payload,
    depotId: payload.depotId,
    userIds: payload.userIds,
    module: "ventes",
    actionUrl: payload.actionUrl as string | undefined,
    category: "SUCCESS",
  });
}

export function dispatchExitVoucherGenerated(payload: NotificationPayload & { depotId?: string; userIds?: string[] }) {
  dispatchNotificationEventAsync({
    eventType: "EXIT_VOUCHER_GENERATED",
    payload,
    depotId: payload.depotId,
    userIds: payload.userIds,
    module: "magasin",
    category: "ACTION_REQUIRED",
  });
}
