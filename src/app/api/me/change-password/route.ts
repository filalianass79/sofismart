import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { changePasswordSchema } from "@/lib/validations/user-account";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: gate.session.user.id } });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      passwordMustChange: false,
      temporaryPassword: false,
    },
  });

  await createAuditLog({
    actorUserId: user.id,
    action: "PASSWORD_CHANGED",
    module: "auth",
    targetType: "User",
    targetId: user.id,
  });

  return NextResponse.json({ ok: true, passwordMustChange: false });
}
