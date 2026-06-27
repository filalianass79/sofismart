import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermissionFresh("caisse.view");
  if ("response" in gate) return gate.response;

  const categories = await prisma.cashCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}
