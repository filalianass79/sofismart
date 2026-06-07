import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const session = await prisma.userSession.findFirst({
    where: { id, userId: gate.session.user.id },
  });
  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  await prisma.userSession.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
