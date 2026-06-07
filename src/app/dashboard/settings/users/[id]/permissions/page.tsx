import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { UserPermissionsEditor } from "./user-permissions-editor";

type Props = { params: Promise<{ id: string }> };

export default async function UserPermissionsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (id === session.user.id) redirect("/dashboard/profile");

  const perms = await loadUserPermissions(prisma, session.user.id);
  if (!hasPermission(perms, "utilisateurs.manage_permissions")) redirect("/dashboard");

  const user = await prisma.user.findUnique({ where: { id }, include: { appRole: true } });
  if (!user) notFound();

  const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
  const userPermissions = await prisma.userPermission.findMany({ where: { userId: id } });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl text-navy-950">
        Permissions — {user.email}
      </h2>
      <p className="text-sm text-navy-600">Rôle de base : {user.appRole?.name}. Les cases complètent ou restreignent le rôle.</p>
      <UserPermissionsEditor
        userId={id}
        permissions={permissions}
        userPermissions={userPermissions.map((u) => ({ permissionId: u.permissionId, allowed: u.allowed }))}
      />
    </div>
  );
}
