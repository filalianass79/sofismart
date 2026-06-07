import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { emailProviderStatus } from "@/lib/notifications/email/email.service";
import { getFromAddress } from "@/lib/notifications/email/email.provider";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermissionFresh("emails.view");
  if ("response" in gate) return gate.response;
  const from = getFromAddress();
  return NextResponse.json({
    ...emailProviderStatus(),
    fromEmail: from.email,
    fromName: from.name,
  });
}
