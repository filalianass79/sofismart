import { prisma } from "@/lib/prisma";
import type { NotificationEventType } from "@/generated/prisma/enums";
import { appBaseUrl, renderTemplate } from "@/lib/notifications/template-utils";
import { findUsersByRoleCodes, findWarehouseUsersForDepot } from "@/lib/notifications/recipients";
import { normalizePhone } from "@/lib/notifications/phone";
import { getWhatsAppTemplateForEvent } from "./whatsapp-template.service";
import { sendWhatsAppNotification } from "./whatsapp.service";
import { enqueueWhatsAppJob } from "./whatsapp-queue";
import type { DispatchWhatsAppContext, DispatchWhatsAppPayload } from "./types";

const EVENT_TEMPLATE_KEYS: Partial<Record<NotificationEventType, string>> = {
  SALE_VALIDATION_REQUEST: "sale_validation_request",
  SALE_VALIDATED: "sale_validated_warehouse",
  EXIT_VOUCHER_GENERATED: "exit_voucher_generated",
  DELIVERY_CONFIRMED: "delivery_confirmed",
  PURCHASE_VALIDATION_REQUEST: "purchase_validation_request",
  PAYMENT_OVERDUE: "payment_overdue_alert",
};

type ResolvedRecipient = {
  userId: string;
  employeeId?: string;
  name: string;
  phone: string;
};

async function resolveWhatsAppRecipients(ctx: DispatchWhatsAppContext): Promise<ResolvedRecipient[]> {
  const setting = await prisma.notificationSetting.findUnique({
    where: { eventType: ctx.eventType },
  });
  if (setting && (!setting.isActive || !setting.whatsappEnabled)) return [];

  const userIds = new Set<string>(ctx.userIds ?? []);
  if (setting?.recipientUserIds?.length) setting.recipientUserIds.forEach((id) => userIds.add(id));
  if (setting?.recipientRoles?.length) {
    const users = await findUsersByRoleCodes(setting.recipientRoles);
    users.forEach((u) => userIds.add(u.id));
  }
  if (setting?.sendToManager) {
    const managers = await findUsersByRoleCodes(["GERANT", "ADMIN", "DIRECTEUR"]);
    managers.forEach((u) => userIds.add(u.id));
  }
  if (ctx.depotId && (setting?.sendToWarehouse ?? true)) {
    const wh = await findWarehouseUsersForDepot(ctx.depotId);
    wh.forEach((u) => userIds.add(u.id));
  }
  if (ctx.commercialId && setting?.sendToCommercial) {
    userIds.add(ctx.commercialId);
  }
  if (ctx.commercialId && ctx.eventType === "SALE_VALIDATED") {
    userIds.add(ctx.commercialId);
  }

  const recipients: ResolvedRecipient[] = [];
  const seen = new Set<string>();

  for (const userId of userIds) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        notificationPreferences: true,
      },
    });
    if (!user || user.accountStatus !== "ACTIVE") continue;

    const emp = user.employee;
    const prefs = user.notificationPreferences;

    const whatsappAllowed =
      (emp?.whatsappEnabled === true && emp?.whatsappConsent === true) ||
      (prefs?.whatsappOptIn === true && prefs?.whatsappEnabled !== false);

    if (!whatsappAllowed) continue;

    const channel = emp?.preferredNotificationChannel ?? "ALL";
    if (channel === "INTERNAL" || channel === "EMAIL") continue;

    const rawPhone = emp?.whatsappPhone ?? prefs?.phoneOverride ?? emp?.phone ?? null;
    const phone = normalizePhone(rawPhone);
    if (!phone) continue;

    const key = userId;
    if (seen.has(key)) continue;
    seen.add(key);

    recipients.push({
      userId,
      employeeId: emp?.id,
      name: user.name ?? `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim(),
      phone,
    });
  }

  return recipients;
}

function enrichPayload(payload: DispatchWhatsAppPayload): DispatchWhatsAppPayload {
  const base = appBaseUrl();
  const out = { ...payload };
  for (const key of ["actionUrl", "documentUrl"] as const) {
    const v = out[key];
    if (v && !String(v).startsWith("http")) out[key] = `${base}${v}`;
  }
  return out;
}

/**
 * Dispatcher WhatsApp production — non bloquant.
 */
export function dispatchWhatsAppEvent(ctx: DispatchWhatsAppContext): void {
  enqueueWhatsAppJob(() => dispatchWhatsAppEventSync(ctx));
}

export async function dispatchWhatsAppEventSync(ctx: DispatchWhatsAppContext): Promise<void> {
  try {
    const payload = enrichPayload(ctx.payload);
    const recipients = await resolveWhatsAppRecipients(ctx);
    if (!recipients.length) return;

    const templateKey = EVENT_TEMPLATE_KEYS[ctx.eventType];
    const tpl = templateKey
      ? await prisma.whatsAppTemplate.findUnique({ where: { key: templateKey } })
      : await getWhatsAppTemplateForEvent(ctx.eventType);

    const fallbackTemplate = await prisma.notificationTemplate.findFirst({
      where: { eventType: ctx.eventType, channel: "WHATSAPP", isActive: true },
    });

    for (const r of recipients) {
      const vars = {
        ...payload,
        employeeName: r.name,
      } as Record<string, string | number | undefined | null>;

      let messageBody: string | undefined;
      if (!tpl?.metaTemplateName && fallbackTemplate) {
        messageBody = renderTemplate(fallbackTemplate.body, vars);
      } else if (!tpl?.metaTemplateName && tpl) {
        messageBody = renderTemplate(tpl.body, vars);
      }

      await sendWhatsAppNotification({
        eventType: ctx.eventType,
        recipient: {
          userId: r.userId,
          employeeId: r.employeeId,
          name: r.name,
          phone: r.phone,
        },
        templateKey: tpl?.key ?? templateKey,
        variables: vars,
        actionUrl: payload.actionUrl ? String(payload.actionUrl) : undefined,
        messageBody,
        metadata: { eventType: ctx.eventType },
      });
    }
  } catch (e) {
    console.error("[dispatchWhatsAppEvent]", ctx.eventType, e);
  }
}
