import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;
  const perms = await loadUserPermissions(prisma, gate.session.user.id);
  return NextResponse.json([...perms]);
}
