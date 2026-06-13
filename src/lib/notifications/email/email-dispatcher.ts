import { prisma } from "@/lib/prisma";
import type { EmailDispatchContext, EmailDispatchPayload } from "./types";
import { isValidEmail, normalizeEmailList } from "./email-utils";
import { isEmailEnabled } from "./email.provider";
import {
  fallbackEmailHtml,
  isSecurityEmailEvent,
  renderEmailHtml,
  renderEmailSubject,
  wrapEmailLayout,
} from "./email-renderer";
import { renderTemplate } from "../template-utils";
import { appBaseUrl } from "../template-utils";
import { findUsersByRoleCodes, findWarehouseUsersForDepot } from "../recipients";
import { enqueueNotificationJob } from "../notification-queue";
import { sendTransactionalEmail } from "./email-log.service";
import { buildSaleValidationEmailUrl } from "@/lib/sales/sale-validation-token";
import { renderEmailButton } from "./email-renderer";

async function resolveUserEmail(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, accountStatus: true, userEmailPreference: true },
  });
  if (!u || u.accountStatus !== "ACTIVE") return null;
  const email = u.userEmailPreference?.alternativeEmail ?? u.email;
  return isValidEmail(email) ? email : null;
}

function enrichPayload(payload: EmailDispatchPayload): EmailDispatchPayload {
  const base = appBaseUrl();
  const out = { ...payload };
  for (const key of ["actionUrl", "documentUrl", "validateUrl"] as const) {
    const v = out[key];
    if (v && !String(v).startsWith("http")) out[key] = `${base}${v}`;
  }
  return out;
}

function fallbackSaleValidationRequestHtml(payload: EmailDispatchPayload): string {
  const body = String(payload.message ?? payload.title ?? "Demande de validation de vente");
  const validateUrl = payload.validateUrl ? String(payload.validateUrl) : undefined;
  let inner = `<p>${body.replace(/\n/g, "<br/>")}</p>`;
  if (validateUrl) {
    inner += renderEmailButton("Valider la vente", validateUrl);
  } else if (payload.actionUrl) {
    return fallbackEmailHtml(body, String(payload.actionUrl));
  }
  return wrapEmailLayout(inner, body.slice(0, 120));
}

async function resolveEmailRecipients(ctx: EmailDispatchContext) {
  const setting = await prisma.emailNotificationSetting.findUnique({
    where: { eventType: ctx.eventType },
  });
  const recipients: { email: string; name?: string; userId?: string }[] = [];
  const seen = new Set<string>();

  const add = (email: string, name?: string, userId?: string) => {
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    recipients.push({ email, name, userId });
  };

  const userIds = new Set(ctx.userIds ?? []);
  if (setting?.recipientUserIds?.length) setting.recipientUserIds.forEach((id) => userIds.add(id));
  if (setting?.recipientRoles?.length) {
    const users = await findUsersByRoleCodes(setting.recipientRoles);
    users.forEach((u) => userIds.add(u.id));
  }
  if (ctx.depotId) {
    const wh = await findWarehouseUsersForDepot(ctx.depotId);
    wh.forEach((u) => userIds.add(u.id));
  }

  for (const userId of userIds) {
    const prefs = await prisma.userEmailPreference.findUnique({ where: { userId } });
    if (prefs && !prefs.emailEnabled && !isSecurityEmailEvent(ctx.eventType)) continue;
    if (prefs?.disabledEventTypes.includes(ctx.eventType) && !isSecurityEmailEvent(ctx.eventType))
      continue;
    const email = await resolveUserEmail(userId);
    if (!email) continue;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    add(email, user?.name ?? undefined, userId);
  }

  if (setting?.sendToClient && ctx.clientEmails?.length) {
    for (const e of normalizeEmailList(ctx.clientEmails)) {
      add(e, String(ctx.payload.clientName ?? ""));
    }
  }

  if (setting?.sendToSupplier && ctx.supplierEmails?.length) {
    for (const e of normalizeEmailList(ctx.supplierEmails)) add(e);
  }

  for (const e of normalizeEmailList(ctx.manualEmails)) add(e);

  return { recipients, cc: normalizeEmailList(setting?.ccEmails), bcc: normalizeEmailList(setting?.bccEmails), setting };
}

export async function dispatchEmailEvent(ctx: EmailDispatchContext): Promise<void> {
  if (!isEmailEnabled()) return;
  const { recipients, cc, bcc, setting } = await resolveEmailRecipients(ctx);
  if (setting && (!setting.emailEnabled || !setting.isActive)) return;
  if (!recipients.length) return;

  const template = await prisma.emailTemplate.findFirst({
    where: { eventType: ctx.eventType, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  const payload = enrichPayload(ctx.payload);
  const attachments = setting?.attachDocuments ? ctx.attachments : ctx.attachments;

  for (const r of recipients) {
    let recipientPayload = payload;
    if (ctx.eventType === "SALE_VALIDATION_REQUEST" && r.userId && payload.saleId) {
      const validateUrl = buildSaleValidationEmailUrl(String(payload.saleId), r.userId);
      recipientPayload = enrichPayload({
        ...payload,
        validateUrl,
        employeeName: r.name ?? payload.employeeName ?? "Administrateur",
      });
    } else if (r.name) {
      recipientPayload = { ...payload, employeeName: r.name };
    }

    let subject = template
      ? renderEmailSubject(template.subjectTemplate, recipientPayload)
      : String(recipientPayload.subject ?? recipientPayload.title ?? ctx.eventType.replace(/_/g, " "));

    let html = template
      ? renderEmailHtml(template.htmlTemplate, recipientPayload)
      : fallbackSaleValidationRequestHtml(recipientPayload);

    if (
      ctx.eventType === "SALE_VALIDATION_REQUEST" &&
      recipientPayload.validateUrl &&
      template &&
      !String(template.htmlTemplate).includes("validateUrl")
    ) {
      html = renderEmailHtml(
        `${template.htmlTemplate}${renderEmailButton("Valider la vente", "{validateUrl}")}`,
        recipientPayload,
      );
    }

    const text = template?.textTemplate ? renderTemplate(template.textTemplate, recipientPayload) : undefined;

    await sendTransactionalEmail({
      to: r.email,
      toName: r.name,
      subject,
      html,
      text,
      cc,
      bcc,
      recipientUserId: r.userId,
      eventType: ctx.eventType,
      templateKey: template?.key,
      emailType: ctx.emailType ?? "NOTIFICATION",
      attachments,
    });
  }
}

export function dispatchEmailEventAsync(ctx: EmailDispatchContext) {
  enqueueNotificationJob(() => dispatchEmailEvent(ctx));
}

export function buildEmailContextFromNotification(
  ctx: import("../types").DispatchContext,
): EmailDispatchContext {
  return {
    eventType: ctx.eventType,
    payload: ctx.payload as EmailDispatchPayload,
    userIds: ctx.userIds,
    clientEmails: ctx.clientEmails,
    depotId: ctx.depotId,
    attachments: ctx.attachments,
  };
}
