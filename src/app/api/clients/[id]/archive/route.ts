import { NextResponse } from "next/server";
import { requirePermissionFresh } from "@/lib/api-auth";
import { archiveClient } from "@/lib/services/client-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.archive");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const client = await archiveClient(id);
  return NextResponse.json(client);
}
