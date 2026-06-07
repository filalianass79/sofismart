import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { maskPhone } from "@/lib/notifications/phone";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("whatsapp.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 50), 200);

  const rows = await prisma.whatsAppMessage.findMany({
    where: status ? { status: status as "PENDING" | "SENT" | "FAILED" | "DELIVERED" | "READ" } : {},
    orderBy: { createdAt: "desc" },
    take,
    include: { recipientUser: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      recipientPhoneMasked: maskPhone(r.recipientPhone),
    })),
  );
}
