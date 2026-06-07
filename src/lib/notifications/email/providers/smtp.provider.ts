import type { EmailProvider } from "../email.provider";
import {
  getEmailTestRecipient,
  getFromAddress,
  isEmailLogOnly,
  isEmailTestMode,
} from "../email.provider";
import type { EmailSendResult, SendEmailParams } from "../types";
import { resolveAttachmentPath } from "../email-utils";
import nodemailer from "nodemailer";
import fs from "node:fs/promises";

export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";

  private transporter() {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  async verifyConnection(): Promise<{ ok: boolean; error?: string; hint?: string }> {
    if (isEmailTestMode()) {
      return {
        ok: true,
        hint: "Mode test actif (EMAIL_TEST_MODE=true) : aucune connexion SMTP réelle.",
      };
    }
    if (!process.env.SMTP_HOST?.trim()) {
      return {
        ok: false,
        error: "SMTP_HOST manquant",
        hint: "Ajoutez SMTP_HOST dans .env ou activez EMAIL_TEST_MODE=true pour simuler les envois.",
      };
    }
    try {
      await this.transporter().verify();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Erreur SMTP" };
    }
  }

  private async buildAttachments(attachments: SendEmailParams["attachments"]) {
    if (!attachments?.length) return undefined;
    return Promise.all(
      attachments.map(async (a) => {
        const localPath = resolveAttachmentPath(a.fileUrl);
        if (localPath) {
          try {
            const content = await fs.readFile(localPath);
            return { filename: a.fileName, content };
          } catch {
            return { filename: a.fileName, path: localPath };
          }
        }
        if (a.fileUrl.startsWith("http")) {
          return { filename: a.fileName, href: a.fileUrl };
        }
        return { filename: a.fileName, path: a.fileUrl };
      }),
    );
  }

  async sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
    if (isEmailLogOnly()) {
      return { messageId: `log-only-${Date.now()}`, status: "SENT" };
    }
    if (isEmailTestMode()) {
      const testTo = getEmailTestRecipient();
      if (testTo) {
        const from = getFromAddress();
        try {
          const info = await this.transporter().sendMail({
            from: `"${from.name}" <${from.email}>`,
            to: testTo,
            subject: `[TEST] ${params.subject}`,
            html: `<p><strong>Destinataire original :</strong> ${params.to}</p>${params.html ?? ""}`,
            text: params.text ? `[TEST — destinataire original: ${params.to}]\n${params.text}` : undefined,
          });
          return { messageId: info.messageId ?? String(Date.now()), status: "SENT" };
        } catch (e) {
          return {
            messageId: "",
            status: "FAILED",
            error: e instanceof Error ? e.message : "Erreur SMTP test",
          };
        }
      }
      return { messageId: `test-smtp-${Date.now()}`, status: "SENT" };
    }
    const from = getFromAddress();
    try {
      const info = await this.transporter().sendMail({
        from: `"${from.name}" <${from.email}>`,
        to: params.toName ? `"${params.toName}" <${params.to}>` : params.to,
        cc: params.cc?.length ? params.cc.join(", ") : undefined,
        bcc: params.bcc?.length ? params.bcc.join(", ") : undefined,
        replyTo: params.replyTo ?? process.env.SMTP_REPLY_TO,
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: await this.buildAttachments(params.attachments),
      });
      return { messageId: info.messageId ?? String(Date.now()), status: "SENT" };
    } catch (e) {
      return {
        messageId: "",
        status: "FAILED",
        error: e instanceof Error ? e.message : "Erreur SMTP",
      };
    }
  }
}
