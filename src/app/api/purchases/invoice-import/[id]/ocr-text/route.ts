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
    select: { rawOcrText: true, cleanedOcrText: true, ocrJson: true, ocrStatus: true },
  });
  if (!imp) return NextResponse.json({ error: "Import introuvable" }, { status: 404 });
  return NextResponse.json({
    rawOcrText: imp.rawOcrText,
    cleanedOcrText: imp.cleanedOcrText,
    ocrJson: imp.ocrJson,
    ocrStatus: imp.ocrStatus,
  });
}
