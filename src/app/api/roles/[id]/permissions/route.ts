import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("roles.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const rows = await prisma.rolePermission.findMany({
    where: { roleId: id },
    include: { permission: true },
  });
  return NextResponse.json(rows);
}

export async function PUT(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("roles.manage_permissions");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = await req.json();
  const items: { permissionId: string; allowed: boolean }[] = body.permissions ?? [];

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
  if (role.isSystem && role.code === "ADMIN") {
    return NextResponse.json({ error: "Les permissions ADMIN système ne sont pas modifiables" }, { status: 400 });
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: id, permissionId: item.permissionId } },
        update: { allowed: item.allowed },
        create: { roleId: id, permissionId: item.permissionId, allowed: item.allowed },
      })
    )
  );

  await createAuditLog({
    actorUserId: gate.session.user.id,
    action: "ROLE_PERMISSIONS_UPDATED",
    module: "roles",
    targetType: "Role",
    targetId: id,
    newValues: { count: items.length },
  });

  return NextResponse.json({ ok: true });
}
