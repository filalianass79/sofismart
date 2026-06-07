import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requirePermissionFresh } from "@/lib/api-auth";
import { companyAssetTypeSchema } from "@/lib/validations/company-profile";
import { updateCompanyAsset } from "@/lib/services/company-profile-service";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const FIELD_MAP = {
  logo: "logoUrl",
  header: "headerImageUrl",
  footer: "footerImageUrl",
} as const;

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("parametres.edit");
  if ("response" in gate) return gate.response;

  const form = await req.formData();
  const file = form.get("file");
  const typeRaw = form.get("type");
  const parsedType = companyAssetTypeSchema.safeParse(typeRaw);
  if (!parsedType.success) {
    return NextResponse.json({ error: "Type d'asset invalide (logo, header, footer)" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format image non supporté (JPEG, PNG, WebP)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".png";
  const subdir = parsedType.data === "logo" ? "logo" : parsedType.data;
  const dir = path.join(process.cwd(), "public", "uploads", "company", subdir);
  await mkdir(dir, { recursive: true });
  const stored = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, stored), buffer);

  const publicPath = `/uploads/company/${subdir}/${stored}`;
  const field = FIELD_MAP[parsedType.data];
  await updateCompanyAsset(field, publicPath);

  return NextResponse.json({ path: publicPath, field });
}

export async function DELETE(req: Request) {
  const gate = await requirePermissionFresh("parametres.edit");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const typeRaw = searchParams.get("type");
  const parsedType = companyAssetTypeSchema.safeParse(typeRaw);
  if (!parsedType.success) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const field = FIELD_MAP[parsedType.data];
  await updateCompanyAsset(field, null);
  return NextResponse.json({ ok: true });
}
