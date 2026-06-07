import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { depotSchema } from "@/lib/validations/depot";
import { nextDepotReference } from "@/lib/references";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("depots.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city");
  const status = searchParams.get("status");
  const depotType = searchParams.get("depotType");

  const depots = await prisma.depot.findMany({
    where: {
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(status ? { status: status as never } : {}),
      ...(depotType ? { depotType: depotType as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { vehicles: true } },
    },
  });

  const rows = depots.map((d) => ({
    ...d,
    vehiclesCount: d._count.vehicles,
    remainingCapacity: Math.max(0, d.maxCapacity - d._count.vehicles),
    capacityAlert: d._count.vehicles >= d.maxCapacity,
  }));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("depots.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = depotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const depot = await prisma.depot.create({
    data: {
      reference: await nextDepotReference(prisma),
      name: d.name,
      address: d.address ?? null,
      city: d.city ?? null,
      phone: d.phone ?? null,
      managerId: d.managerId ?? null,
      maxCapacity: d.maxCapacity,
      depotType: d.depotType,
      status: d.status,
      notes: d.notes ?? null,
    },
  });
  return NextResponse.json(depot, { status: 201 });
}
