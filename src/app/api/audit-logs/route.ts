import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("parametres.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const moduleFilter = searchParams.get("module");
  const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "50", 10));

  const logs = await prisma.auditLog.findMany({
    where: moduleFilter ? { module: moduleFilter } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actorUser: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json(logs);
}
