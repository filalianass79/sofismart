import type { EmailProvider } from "../email.provider";
import { getFromAddress, isEmailTestMode } from "../email.provider";
import type { EmailSendResult, SendEmailParams } from "../types";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
    if (isEmailTestMode()) {
      return { messageId: `test-resend-${Date.now()}`, status: "SENT" };
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { messageId: "", status: "FAILED", error: "RESEND_API_KEY manquant" };

    const from = getFromAddress();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${from.name} <${from.email}>`,
        to: [params.to],
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo ?? process.env.SMTP_REPLY_TO,
      }),
    });

    const data = (await res.json()) as {
      id?: string;
      message?: string;
      error?: string | { message?: string };
    };
    if (!res.ok) {
      const errMsg =
        typeof data.error === "string"
          ? data.error
          : data.error?.message ?? data.message ?? `HTTP ${res.status}`;
      return { messageId: "", status: "FAILED", error: errMsg };
    }
    return { messageId: data.id ?? "", status: "SENT" };
  }

  async verifyConnection(): Promise<{ ok: boolean; error?: string }> {
    return { ok: Boolean(process.env.RESEND_API_KEY) };
  }
}
