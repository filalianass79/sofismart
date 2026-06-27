import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requirePermissionFresh } from "@/lib/api-auth";
import { getStorageProvider } from "@/lib/storage";
import {
  UPLOAD_MIME,
  assertAllowedMime,
  assertFileSize,
  sanitizeOriginalName,
  secureStoredFilename,
} from "@/lib/upload-security";
import type { CashDocumentType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requirePermissionFresh("caisse.create");
  if ("response" in gate) return gate.response;

  const session = await auth();
  const { id } = await ctx.params;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  try {
    assertAllowedMime(file.type, [...UPLOAD_MIME.documents, ...UPLOAD_MIME.images]);
    assertFileSize(file.size);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const movement = await prisma.cashMovement.findUnique({ where: { id } });
  if (!movement) return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });

  const rawType = String(form.get("type") ?? "OTHER");
  const docType = (["RECEIPT", "INVOICE", "VOUCHER", "PHOTO", "OTHER"].includes(rawType)
    ? rawType
    : "OTHER") as CashDocumentType;

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = secureStoredFilename(file.name, file.type);
  const relativePath = `treasury/${id}/${stored}`;
  const storage = getStorageProvider();
  const saved = await storage.save({ buffer, relativePath, mimeType: file.type });

  const doc = await prisma.cashDocument.create({
    data: {
      movementId: id,
      cashboxId: movement.cashboxId,
      type: docType,
      title: (form.get("title") as string) || sanitizeOriginalName(file.name),
      fileName: sanitizeOriginalName(file.name),
      fileUrl: saved.publicPath,
      fileMimeType: file.type,
      fileSize: buffer.length,
      uploadedById: session?.user?.id,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
