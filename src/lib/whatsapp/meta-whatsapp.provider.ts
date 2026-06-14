import type { WhatsAppProvider } from "./whatsapp.provider";
import { isWhatsAppTestMode } from "./whatsapp.provider";
import type { WhatsAppSendResult } from "./types";

export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = "meta";

  private apiBase(): string {
    const version = process.env.WHATSAPP_API_VERSION ?? "v20.0";
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID manquant");
    return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  }

  private headers(): HeadersInit {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN manquant");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async verifyConnection(): Promise<{ ok: boolean; error?: string }> {
    if (isWhatsAppTestMode()) return { ok: true };
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return { ok: false, error: "WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manquant" };
    }
    const version = process.env.WHATSAPP_API_VERSION ?? "v20.0";
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  }

  async sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult> {
    if (isWhatsAppTestMode()) {
      return { messageId: `test-meta-${Date.now()}`, status: "SENT" };
    }

    const res = await fetch(this.apiBase(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message.slice(0, 4096) },
      }),
    });

    return this.parseResponse(res);
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    bodyParameters: string[],
  ): Promise<WhatsAppSendResult> {
    if (isWhatsAppTestMode()) {
      return { messageId: `test-meta-tpl-${Date.now()}`, status: "SENT" };
    }

    const components =
      bodyParameters.length > 0
        ? [{ type: "body", parameters: bodyParameters.map((text) => ({ type: "text", text: String(text).slice(0, 1024) })) }]
        : undefined;

    const res = await fetch(this.apiBase(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          ...(components ? { components } : {}),
        },
      }),
    });

    return this.parseResponse(res);
  }

  private async parseResponse(res: Response): Promise<WhatsAppSendResult> {
    const data = (await res.json()) as {
      messages?: { id: string }[];
      error?: { message: string };
    };
    if (!res.ok) {
      return {
        messageId: "",
        status: "FAILED",
        error: data.error?.message ?? `HTTP ${res.status}`,
      };
    }
    return {
      messageId: data.messages?.[0]?.id ?? "",
      status: "SENT",
    };
  }
}
