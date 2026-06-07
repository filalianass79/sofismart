import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function GET() {
  const gate = await requirePermission("documents:*");
  if ("response" in gate) return gate.response;
  const rows = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(rows);
}
