import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

export async function GET() {
  const gate = await requirePermissionFresh("roles.view");
  if ("response" in gate) return gate.response;
  const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
  return NextResponse.json(permissions);
}
