import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("utilisateurs.manage_permissions");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const rows = await prisma.userPermission.findMany({
    where: { userId: id },
    include: { permission: true },
  });
  return NextResponse.json(rows);
}

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("utilisateurs.manage_permissions");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  if (id === gate.session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas modifier vos propres permissions" }, { status: 403 });
  }

  const body = await req.json();
  const items: { permissionId: string; allowed: boolean }[] = body.permissions ?? [];

  await prisma.$transaction(
    items.map((item) =>
      prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: id, permissionId: item.permissionId } },
        update: { allowed: item.allowed },
        create: { userId: id, permissionId: item.permissionId, allowed: item.allowed },
      })
    )
  );

  await createAuditLog({
    actorUserId: gate.session.user.id,
    action: "USER_PERMISSIONS_UPDATED",
    module: "utilisateurs",
    targetType: "User",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
