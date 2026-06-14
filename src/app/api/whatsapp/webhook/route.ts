import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { updateWhatsAppStatusFromWebhook } from "@/lib/whatsapp/whatsapp.service";
import type { WhatsAppMessageStatus } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET ?? process.env.META_APP_SECRET;
  if (!secret || !signatureHeader?.startsWith("sha256=")) return !secret;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice(7);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

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
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET) {
    if (!verifyMetaSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const body = JSON.parse(rawBody) as {
      entry?: {
        changes?: {
          value?: {
            statuses?: { id: string; status: string; errors?: { message?: string }[] }[];
            messages?: unknown[];
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
            const errMsg = st.errors?.[0]?.message;
            await updateWhatsAppStatusFromWebhook(st.id, status, errMsg);
          }
        }
      }
    }

    await createAuditLog({
      action: "WHATSAPP_WEBHOOK_RECEIVED",
      module: "whatsapp",
      targetType: "Webhook",
      newValues: { hasStatuses: true },
    });
  } catch {
    /* ignore malformed webhook */
  }
  return NextResponse.json({ ok: true });
}
