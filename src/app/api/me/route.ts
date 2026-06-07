import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  const user = await prisma.user.findUnique({
    where: { id: gate.session.user.id },
    include: {
      employee: { include: { depot: true } },
      appRole: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ...user, passwordHash: undefined });
}

export async function PUT(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: gate.session.user.id },
    data: {
      recoveryEmail: body.recoveryEmail ?? undefined,
      image: body.image ?? undefined,
    },
    include: { employee: true },
  });

  if (body.profilePhotoUrl && user.employeeId) {
    await prisma.employee.update({
      where: { id: user.employeeId },
      data: { profilePhotoUrl: body.profilePhotoUrl },
    });
  }

  return NextResponse.json({ ...user, passwordHash: undefined });
}
