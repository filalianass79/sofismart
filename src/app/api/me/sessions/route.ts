import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const sessions = await prisma.userSession.findMany({
    where: { userId: gate.session.user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sessions);
}
