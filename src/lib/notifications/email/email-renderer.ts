import { renderTemplate } from "../template-utils";

const SECURITY_EVENTS = new Set([
  "PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "USER_CREATED",
  "ACCOUNT_BLOCKED",
]);

export function wrapEmailLayout(bodyHtml: string, preheader?: string): string {
  const logo = process.env.EMAIL_LOGO_URL ?? "";
  const support = process.env.EMAIL_SUPPORT_EMAIL ?? process.env.SMTP_REPLY_TO ?? "";
  const appUrl = process.env.APP_URL ?? "https://sofismart.ma";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SOFISMART</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader ?? ""}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#0f172a;padding:20px 24px;text-align:center;">
${logo ? `<img src="${logo}" alt="SOFISMART" height="40" style="display:block;margin:0 auto;"/>` : `<span style="color:#d4a017;font-size:22px;font-weight:bold;">SOFISMART</span>`}
</td></tr>
<tr><td style="padding:28px 24px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b;text-align:center;">
<p style="margin:0 0 8px;">Gestion automobile — SOFISMART</p>
${support ? `<p style="margin:0;"><a href="mailto:${support}" style="color:#b8860b;">${support}</a></p>` : ""}
<p style="margin:8px 0 0;"><a href="${appUrl}" style="color:#64748b;">${appUrl}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function renderEmailButton(label: string, url: string): string {
  return `<p style="margin:24px 0;text-align:center;">
<a href="${url}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a>
</p>`;
}

export function renderPlainBodyFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function renderEmailSubject(template: string, payload: Record<string, unknown>): string {
  return renderTemplate(template, payload as Record<string, string | number | null | undefined>);
}

export function renderEmailHtml(template: string, payload: Record<string, unknown>): string {
  const inner = renderTemplate(template, payload as Record<string, string | number | null | undefined>);
  return wrapEmailLayout(inner, renderPlainBodyFromHtml(inner).slice(0, 120));
}

export function isSecurityEmailEvent(eventType: string): boolean {
  return SECURITY_EVENTS.has(eventType);
}

export function fallbackEmailHtml(body: string, actionUrl?: string): string {
  let inner = `<p>${body.replace(/\n/g, "<br/>")}</p>`;
  if (actionUrl) inner += renderEmailButton("Voir le détail", actionUrl);
  return wrapEmailLayout(inner);
}
