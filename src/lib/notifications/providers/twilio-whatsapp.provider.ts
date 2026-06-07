import type { WhatsAppProvider } from "../whatsapp.provider";
import { isWhatsAppTestMode } from "../whatsapp.provider";
import type { WhatsAppSendResult } from "../types";

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  readonly name = "twilio";

  async sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult> {
    if (isWhatsAppTestMode()) {
      return { messageId: `test-twilio-${Date.now()}`, status: "SENT" };
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!sid || !token || !from) {
      return { messageId: "", status: "FAILED", error: "Configuration Twilio incomplète" };
    }

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({
      To: `whatsapp:+${to}`,
      From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      Body: message.slice(0, 1600),
    });

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) {
      return { messageId: "", status: "FAILED", error: data.message ?? `HTTP ${res.status}` };
    }
    return { messageId: data.sid ?? "", status: "SENT" };
  }
}
