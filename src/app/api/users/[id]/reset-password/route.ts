import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { resetUserPassword } from "@/lib/services/user-account";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("utilisateurs.reset_password");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const temporaryPassword = await resetUserPassword(id, gate.session.user.id);
    return NextResponse.json({ temporaryPassword, passwordMustChange: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
