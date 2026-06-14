import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh, requireVehicleCatalogAccess } from "@/lib/api-auth";
import { brandSchema } from "@/lib/validations/brand";

export async function GET(req: Request) {
  const gate = await requireVehicleCatalogAccess();
  if ("response" in gate) return gate.response;

  const q = new URL(req.url).searchParams.get("q")?.trim();
  const rows = await prisma.brand.findMany({
    where: q ? { label: { contains: q, mode: "insensitive" } } : {},
    orderBy: { label: "asc" },
    include: { _count: { select: { models: true, vehicles: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("parametres.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const row = await prisma.brand.create({ data: parsed.data });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Cette marque existe déjà" }, { status: 409 });
  }
}
