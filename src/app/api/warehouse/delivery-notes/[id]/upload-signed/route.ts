import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { warehouseSessionScope } from "@/lib/warehouse/api-guard";
import { uploadSignedDeliveryDocument } from "@/lib/services/delivery-note-service";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX = 12 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await warehouseSessionScope("warehouse.delivery_note.upload_signed");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format non autorisé (PDF, JPG, PNG, WEBP)" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 12 Mo)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "pdf";
  const stored = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "delivery-signed", id);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, stored), buffer);
  const fileUrl = `/uploads/delivery-signed/${id}/${stored}`;

  try {
    const doc = await uploadSignedDeliveryDocument(
      id,
      gate.session.user.id,
      { fileName: file.name, fileUrl, mimeType: file.type, size: file.size },
      {
        title: (form.get("title") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
      }
    );
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
