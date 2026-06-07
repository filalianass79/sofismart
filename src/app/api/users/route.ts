import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { createUserSchema } from "@/lib/validations/user-account";
import { createUserAccount } from "@/lib/services/user-account";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("utilisateurs.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const roleId = searchParams.get("roleId");
  const accountStatus = searchParams.get("accountStatus");

  const users = await prisma.user.findMany({
    where: {
      ...(roleId ? { roleId } : {}),
      ...(accountStatus ? { accountStatus: accountStatus as never } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              {
                employee: {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { reference: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { id: true, reference: true, firstName: true, lastName: true, jobFunction: true } },
      appRole: { select: { id: true, code: true, name: true } },
    },
  });
  return NextResponse.json(users.map((u) => ({ ...u, passwordHash: undefined })));
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("utilisateurs.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { user, temporaryPassword } = await createUserAccount({
      ...parsed.data,
      generateTemporary: parsed.data.generateTemporary ?? !parsed.data.password,
      actorUserId: gate.session.user.id,
    });
    return NextResponse.json(
      { ...user, passwordHash: undefined, temporaryPassword },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
