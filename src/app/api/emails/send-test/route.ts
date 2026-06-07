import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { sendTestEmailSchema } from "@/lib/validations/email";
import { sendTransactionalEmail } from "@/lib/notifications/email/email-log.service";
import { fallbackEmailHtml } from "@/lib/notifications/email/email-renderer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("emails.create");
  if ("response" in gate) return gate.response;
  const parsed = sendTestEmailSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const html = fallbackEmailHtml(parsed.data.message);
  const result = await sendTransactionalEmail({
    to: parsed.data.to,
    subject: parsed.data.subject,
    html,
    text: parsed.data.message,
    emailType: "SYSTEM",
    templateKey: "test",
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error ?? "Échec d'envoi — consultez les logs email",
        id: result.id,
        ok: false,
      },
      { status: 422 },
    );
  }
  return NextResponse.json({ ...result, ok: true });
}
