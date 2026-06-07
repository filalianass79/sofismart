import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { auth } from "@/auth";
import type { ClientDocumentType } from "@/generated/prisma/enums";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const docs = await prisma.clientDocument.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true, email: true } } },
  });
  return NextResponse.json(docs);
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requirePermissionFresh("clients.upload_documents");
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const session = await auth();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  }

  const type = (String(form.get("type") ?? "OTHER") as ClientDocumentType) || "OTHER";
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".bin";
  const dir = path.join(process.cwd(), "public", "uploads", "clients", id);
  await mkdir(dir, { recursive: true });
  const stored = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, stored), buffer);
  const fileUrl = `/uploads/clients/${id}/${stored}`;

  const doc = await prisma.clientDocument.create({
    data: {
      clientId: id,
      type,
      title: (form.get("title") as string) || file.name,
      fileName: file.name,
      fileUrl,
      fileMimeType: file.type || null,
      fileSize: buffer.length,
      notes: (form.get("notes") as string) || null,
      uploadedById: session?.user?.id ?? null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
