import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { getWhatsAppProviderStatus } from "@/lib/whatsapp/whatsapp.service";
import { MetaWhatsAppProvider } from "@/lib/whatsapp/meta-whatsapp.provider";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermissionFresh("whatsapp.view");
  if ("response" in gate) return gate.response;

  const status = getWhatsAppProviderStatus();
  let connection = { ok: status.configured };
  if (status.provider === "meta" && status.configured && !status.testMode) {
    connection = await new MetaWhatsAppProvider().verifyConnection();
  }

  return NextResponse.json({ ...status, connection });
}
