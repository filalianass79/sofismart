import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { sendWhatsAppTestSchema } from "@/lib/validations/notifications";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("whatsapp.create");
  if ("response" in gate) return gate.response;

  const body = sendWhatsAppTestSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await sendWhatsAppMessage({
    to: body.data.phone,
    message: body.data.message,
    recipientUserId: gate.session.user.id,
    recipientName: gate.session.user.name ?? null,
    templateKey: "test",
  });

  return NextResponse.json(result);
}
