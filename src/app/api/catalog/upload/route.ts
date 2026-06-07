import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/api-auth";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export async function POST(req: Request) {
  const gate = await requirePermission("users:*");
  if ("response" in gate) return gate.response;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format image non supporté" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".png";
  const dir = path.join(process.cwd(), "public", "uploads", "catalog");
  await mkdir(dir, { recursive: true });
  const stored = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, stored), buffer);

  return NextResponse.json({ path: `/uploads/catalog/${stored}` });
}
