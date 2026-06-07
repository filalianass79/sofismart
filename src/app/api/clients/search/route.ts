import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionFresh } from "@/lib/api-auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const gate = await requirePermissionFresh("clients.view");
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type");
  const city = searchParams.get("city");
  const commercialId = searchParams.get("commercialId");
  const financialStatus = searchParams.get("financialStatus");
  const relationshipStatus = searchParams.get("relationshipStatus");
  const withOutstanding = searchParams.get("withOutstanding") === "true";
  const activeOnly = searchParams.get("activeOnly") !== "false";

  const where: Prisma.ClientWhereInput = {
    isArchived: activeOnly ? false : undefined,
    ...(type ? { type: type as never } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(commercialId ? { assignedCommercialId: commercialId } : {}),
    ...(financialStatus ? { financialStatus: financialStatus as never } : {}),
    ...(relationshipStatus ? { relationshipStatus: relationshipStatus as never } : {}),
    ...(withOutstanding ? { outstandingAmount: { gt: 0 } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
            { tradeName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { cin: { contains: q, mode: "insensitive" } },
            { ice: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.client.findMany({
    where,
    take: 50,
    orderBy: { name: "asc" },
    select: {
      id: true,
      reference: true,
      type: true,
      name: true,
      firstName: true,
      lastName: true,
      companyName: true,
      phone: true,
      email: true,
      cin: true,
      ice: true,
      city: true,
      outstandingAmount: true,
      currentBalance: true,
      financialStatus: true,
      relationshipStatus: true,
      _count: { select: { sales: true } },
    },
  });

  return NextResponse.json(
    rows.map((c) => ({
      ...c,
      outstandingAmount: Number(c.outstandingAmount),
      currentBalance: Number(c.currentBalance),
      salesCount: c._count.sales,
    }))
  );
}
