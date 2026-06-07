import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import type { AccountStatus } from "@/generated/prisma/enums";

export async function countActiveAdmins(excludeUserId?: string) {
  const adminRole = await prisma.role.findUnique({ where: { code: "ADMIN" } });
  if (!adminRole) return 0;
  return prisma.user.count({
    where: {
      id: excludeUserId ? { not: excludeUserId } : undefined,
      roleId: adminRole.id,
      accountStatus: "ACTIVE",
    },
  });
}

export async function createUserAccount(data: {
  employeeId: string;
  email: string;
  username?: string;
  roleId: string;
  password?: string;
  generateTemporary?: boolean;
  actorUserId: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { employeeId: data.employeeId }] },
  });
  if (existing) throw new Error("Compte ou salarié déjà lié");

  const temp = data.generateTemporary || !data.password;
  const plain = data.password ?? generateTemporaryPassword();

  const user = await prisma.user.create({
    data: {
      employeeId: data.employeeId,
      email: data.email.toLowerCase(),
      username: data.username ?? data.email.split("@")[0],
      passwordHash: await hashPassword(plain),
      roleId: data.roleId,
      accountStatus: "ACTIVE",
      passwordMustChange: temp,
      temporaryPassword: temp,
      name: undefined,
    },
    include: { appRole: true, employee: true },
  });

  await createAuditLog({
    actorUserId: data.actorUserId,
    action: "USER_CREATED",
    module: "utilisateurs",
    targetType: "User",
    targetId: user.id,
    newValues: { email: user.email, roleId: data.roleId },
  });

  return { user, temporaryPassword: temp ? plain : undefined };
}

export async function resetUserPassword(userId: string, actorUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const admins = await countActiveAdmins();
  if (admins <= 1 && user.roleId) {
    const role = await prisma.role.findUnique({ where: { id: user.roleId } });
    if (role?.code === "ADMIN") throw new Error("Impossible de réinitialiser le dernier administrateur actif");
  }

  const plain = generateTemporaryPassword();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(plain),
      passwordMustChange: true,
      temporaryPassword: true,
    },
  });

  await createAuditLog({
    actorUserId,
    action: "PASSWORD_RESET",
    module: "utilisateurs",
    targetType: "User",
    targetId: userId,
  });

  return plain;
}

export async function setAccountStatus(
  userId: string,
  status: AccountStatus,
  actorUserId: string,
  action: string
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: status },
  });

  if (status !== "ACTIVE") {
    const adminRole = await prisma.role.findUnique({ where: { code: "ADMIN" } });
    if (adminRole && user.roleId === adminRole.id) {
      const count = await countActiveAdmins(userId);
      if (count < 1) throw new Error("Impossible de désactiver le dernier administrateur actif");
    }
  }

  await createAuditLog({
    actorUserId,
    action,
    module: "utilisateurs",
    targetType: "User",
    targetId: userId,
    newValues: { accountStatus: status },
  });

  return user;
}

export async function archiveEmployee(employeeId: string, actorUserId: string) {
  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "ARCHIVED" },
    include: { user: true },
  });

  if (employee.user) {
    await prisma.user.update({
      where: { id: employee.user.id },
      data: { accountStatus: "DISABLED" },
    });
    await createAuditLog({
      actorUserId,
      action: "USER_DEACTIVATED",
      module: "utilisateurs",
      targetType: "User",
      targetId: employee.user.id,
      newValues: { reason: "employee_archived" },
    });
  }

  await createAuditLog({
    actorUserId,
    action: "EMPLOYEE_ARCHIVED",
    module: "salaries",
    targetType: "Employee",
    targetId: employeeId,
  });

  return employee;
}
