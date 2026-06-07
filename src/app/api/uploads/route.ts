import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { auth } from "@/auth";
import { DocumentCategory } from "@/generated/prisma/enums";
import type { DocumentCategory as DocumentCategoryT } from "@/generated/prisma/enums";
import { getStorageProvider } from "@/lib/storage";
import {
  UPLOAD_MIME,
  assertAllowedMime,
  assertFileSize,
  sanitizeOriginalName,
  secureStoredFilename,
} from "@/lib/upload-security";

export async function POST(req: Request) {
  const gate = await requirePermission("documents:*");
  if ("response" in gate) return gate.response;

  const session = await auth();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  try {
    assertAllowedMime(file.type, UPLOAD_MIME.documents);
    assertFileSize(file.size);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const rawCat = String(form.get("category") ?? "OTHER");
  const allowed = Object.values(DocumentCategory) as string[];
  const category = (allowed.includes(rawCat) ? rawCat : "OTHER") as DocumentCategoryT;
  const vehicleId = (form.get("vehicleId") as string) || undefined;
  const clientId = (form.get("clientId") as string) || undefined;
  const supplierId = (form.get("supplierId") as string) || undefined;
  const purchaseId = (form.get("purchaseId") as string) || undefined;
  const saleId = (form.get("saleId") as string) || undefined;

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeBase = sanitizeOriginalName(file.name);
  const stored = secureStoredFilename(file.name, file.type);
  const relativePath = `${category.toLowerCase()}/${stored}`;
  const storage = getStorageProvider();
  const saved = await storage.save({ buffer, relativePath, mimeType: file.type });
  const publicPath = saved.publicPath;

  const doc = await prisma.document.create({
    data: {
      category,
      originalName: safeBase,
      path: publicPath,
      mimeType: file.type || null,
      size: buffer.length,
      vehicleId,
      clientId,
      supplierId,
      purchaseId,
      saleId,
      uploadedById: session?.user?.id ?? null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
