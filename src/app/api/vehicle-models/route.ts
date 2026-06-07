import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireVehicleCatalogAccess } from "@/lib/api-auth";
import { vehicleModelSchema } from "@/lib/validations/vehicle-model";

export async function GET(req: Request) {
  const gate = await requireVehicleCatalogAccess();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId") ?? undefined;
  const q = searchParams.get("q")?.trim();

  const rows = await prisma.vehicleModel.findMany({
    where: {
      ...(brandId ? { brandId } : {}),
      ...(q ? { label: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ brand: { label: "asc" } }, { label: "asc" }],
    include: { brand: { select: { id: true, label: true, logo: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermission("users:*");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = vehicleModelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const row = await prisma.vehicleModel.create({
      data: parsed.data,
      include: { brand: { select: { id: true, label: true } } },
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ce modèle existe déjà pour cette marque" }, { status: 409 });
  }
}
