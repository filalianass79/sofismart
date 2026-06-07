import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { verifyEmailConnection } from "@/lib/notifications/email/email.service";

export const runtime = "nodejs";

export async function POST() {
  const gate = await requirePermissionFresh("emails.create");
  if ("response" in gate) return gate.response;
  const result = await verifyEmailConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
