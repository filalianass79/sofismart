import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("fournisseurs.archive");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const supplier = await prisma.supplier.update({
    where: { id },
    data: { isArchived: true, status: "ARCHIVED" },
  });
  return NextResponse.json(supplier);
}
