import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermissionFresh("notifications.edit");
  if ("response" in gate) return gate.response;
  const rows = await prisma.notificationSetting.findMany({ orderBy: { eventType: "asc" } });
  return NextResponse.json(rows);
}
