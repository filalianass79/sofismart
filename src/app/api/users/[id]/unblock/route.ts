import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { setAccountStatus } from "@/lib/services/user-account";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("utilisateurs.edit");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  try {
    const user = await setAccountStatus(id, "ACTIVE", gate.session.user.id, "USER_UNBLOCKED");
    return NextResponse.json({ ...user, passwordHash: undefined });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
