import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("utilisateurs.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      employee: { include: { depot: true } },
      appRole: true,
      userPermissions: { include: { permission: true } },
      userSessions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ...user, passwordHash: undefined });
}

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("utilisateurs.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = await req.json();

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const user = await prisma.user.update({
    where: { id },
    data: {
      email: body.email?.toLowerCase() ?? undefined,
      username: body.username ?? undefined,
      roleId: body.roleId ?? undefined,
      recoveryEmail: body.recoveryEmail ?? undefined,
    },
    include: { appRole: true, employee: true },
  });

  if (body.roleId && body.roleId !== before.roleId) {
    await createAuditLog({
      actorUserId: gate.session.user.id,
      action: "ROLE_CHANGED",
      module: "utilisateurs",
      targetType: "User",
      targetId: id,
      oldValues: { roleId: before.roleId },
      newValues: { roleId: body.roleId },
    });
  }

  return NextResponse.json({ ...user, passwordHash: undefined });
}
