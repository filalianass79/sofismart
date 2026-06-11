import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePurchaseViewAccess } from "@/lib/api-purchase-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePurchaseViewAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const imp = await prisma.invoiceImport.findUnique({
    where: { id },
    select: {
      aiStructuredData: true,
      aiRawResponse: true,
      aiStatus: true,
      validationErrors: true,
      extractionRuns: { where: { type: "AI" }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!imp) return NextResponse.json({ error: "Import introuvable" }, { status: 404 });
  return NextResponse.json({
    aiStructuredData: imp.aiStructuredData,
    aiRawResponse: imp.aiRawResponse,
    aiStatus: imp.aiStatus,
    validationErrors: imp.validationErrors,
    runs: imp.extractionRuns,
  });
}
