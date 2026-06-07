import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { maskEmail } from "@/lib/notifications/email/email-log.service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("emails.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const eventType = searchParams.get("eventType") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 50), 200);

  const rows = await prisma.emailMessage.findMany({
    where: {
      ...(status ? { status: status as "SENT" | "FAILED" | "QUEUED" } : {}),
      ...(eventType ? { eventType: eventType as never } : {}),
      ...(q
        ? {
            OR: [
              { subject: { contains: q, mode: "insensitive" } },
              { recipientEmail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { attachments: true, recipientUser: { select: { id: true, name: true } } },
  });

  return NextResponse.json(
    rows.map((r) => ({ ...r, recipientEmailMasked: maskEmail(r.recipientEmail) })),
  );
}
