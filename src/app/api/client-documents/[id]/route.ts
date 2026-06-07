import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.delete");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const doc = await prisma.clientDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  try {
    const full = path.join(process.cwd(), "public", doc.fileUrl);
    await unlink(full);
  } catch {
    /* fichier déjà absent */
  }

  await prisma.clientDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
