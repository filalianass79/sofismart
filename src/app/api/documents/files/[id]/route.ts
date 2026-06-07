import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

/** Fichiers uploadés (modèle Document) — distinct des documents commerciaux sous /api/documents/[type]/[id]. */

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requirePermission("documents:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.document.delete({ where: { id } });

  if (doc.path.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", doc.path);
    await unlink(filePath).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requirePermission("documents:*");
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const body = await req.json();

  const doc = await prisma.document.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      notes: body.notes ?? undefined,
      category: body.category ?? undefined,
    },
  });
  return NextResponse.json(doc);
}
