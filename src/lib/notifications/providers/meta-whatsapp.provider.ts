import type { WhatsAppProvider } from "../whatsapp.provider";
import { isWhatsAppTestMode } from "../whatsapp.provider";
import type { WhatsAppSendResult } from "../types";

export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = "meta";

  async sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult> {
    if (isWhatsAppTestMode()) {
      return { messageId: `test-meta-${Date.now()}`, status: "SENT" };
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const version = process.env.WHATSAPP_API_VERSION ?? "v20.0";

    if (!token || !phoneNumberId) {
      return { messageId: "", status: "FAILED", error: "WHATSAPP_ACCESS_TOKEN ou PHONE_NUMBER_ID manquant" };
    }

    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message.slice(0, 4096) },
      }),
    });

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
