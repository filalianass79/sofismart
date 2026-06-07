import { NextResponse } from "next/server";
import { updateWhatsAppStatusFromWebhook } from "@/lib/notifications/whatsapp.service";
import type { WhatsAppMessageStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      entry?: {
        changes?: {
          value?: {
            statuses?: { id: string; status: string }[];
          };
        }[];
      }[];
    };

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const st of change.value?.statuses ?? []) {
          const map: Record<string, WhatsAppMessageStatus> = {
            sent: "SENT",
            delivered: "DELIVERED",
            read: "READ",
            failed: "FAILED",
          };
          const status = map[st.status];
          if (status && st.id) {
            await updateWhatsAppStatusFromWebhook(st.id, status);
          }
        }
      }
    }
  } catch {
    /* ignore malformed webhook */
  }
  return NextResponse.json({ ok: true });
}
