import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import { clientWizardSchema } from "@/lib/validations/client";
import { createClient } from "@/lib/services/client-service";
import { computeClientFinancials } from "@/lib/client-finance";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type");
  const city = searchParams.get("city");
  const commercialId = searchParams.get("commercialId");
  const financialStatus = searchParams.get("financialStatus");
  const archived = searchParams.get("archived");
  const withBalance = searchParams.get("withBalance") === "1";

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  const where = {
    ...(archived === "1" ? { isArchived: true } : archived === "0" ? { isArchived: false } : {}),
    ...(type ? { type: type as "INDIVIDUAL" | "COMPANY" | "RESELLER" } : {}),
    ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}),
    ...(commercialId ? { assignedCommercialId: commercialId } : {}),
    ...(financialStatus ? { financialStatus: financialStatus as never } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { companyName: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
            { cin: { contains: q, mode: "insensitive" as const } },
            { ice: { contains: q, mode: "insensitive" as const } },
            { reference: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        assignedCommercial: { select: { id: true, name: true, email: true } },
        sales: { include: { payments: true } },
        _count: { select: { sales: true, clientDocuments: true } },
      },
    }),
    prisma.client.count({ where }),
  ]);

  const rows = clients.map((c) => {
    const fin = computeClientFinancials(c.sales);
    return {
      ...c,
      sales: undefined,
      vehiclesCount: fin.vehiclesCount,
      totalSales: fin.totalSales,
      outstandingAmount: withBalance ? fin.outstandingAmount : Number(c.outstandingAmount),
      lastSaleDate: fin.lastSaleDate,
    };
  });

  return NextResponse.json(rows, {
    headers: {
      "X-Total-Count": String(total),
      "X-Page": String(page),
      "X-Limit": String(limit),
    },
  });
}

export async function POST(req: Request) {
  const gate = await requirePermissionFresh("clients.create");
  if ("response" in gate) return gate.response;

  const body = await req.json();
  const parsed = clientWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.cin) {
    const dup = await prisma.client.findUnique({ where: { cin: parsed.data.cin } });
    if (dup) return NextResponse.json({ error: "CIN déjà utilisé" }, { status: 409 });
  }
  if (parsed.data.ice) {
    const dup = await prisma.client.findUnique({ where: { ice: parsed.data.ice } });
    if (dup) return NextResponse.json({ error: "ICE déjà utilisé" }, { status: 409 });
  }

  const client = await createClient(parsed.data);
  return NextResponse.json(client, { status: 201 });
}
