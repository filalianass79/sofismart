import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

export async function GET() {
  const gate = await requirePermissionFresh("roles.view");
  if ("response" in gate) return gate.response;

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, rolePermissions: true } } },
  });
  return NextResponse.json(roles);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("roles.create");
  if ("response" in gate) return gate.response;
  const body = await req.json();
  if (!body.code || !body.name) {
    return NextResponse.json({ error: "Code et nom requis" }, { status: 400 });
  }
  const role = await prisma.role.create({
    data: {
      code: String(body.code).toUpperCase(),
      name: body.name,
      description: body.description ?? null,
      isSystem: false,
    },
  });
  return NextResponse.json(role, { status: 201 });
}
