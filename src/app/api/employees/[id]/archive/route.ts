import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { archiveEmployee } from "@/lib/services/user-account";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("salaries.archive");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  try {
    const employee = await archiveEmployee(id, gate.session.user.id);
    return NextResponse.json(employee);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
