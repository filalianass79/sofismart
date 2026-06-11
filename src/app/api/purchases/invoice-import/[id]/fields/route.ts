import { NextResponse } from "next/server";
import { z } from "zod";
import type { ExtractedFieldStatus } from "@/generated/prisma/enums";
import { requirePurchaseEditAccess } from "@/lib/api-purchase-auth";
import { getInvoiceImportPayload, updateImportFields } from "@/lib/invoice-import/invoice-import-service";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  corrections: z.array(
    z.object({
      fieldKey: z.string(),
      correctedValue: z.string().nullable().optional(),
      status: z.string().optional(),
      ignored: z.boolean().optional(),
    }),
  ),
});

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePurchaseEditAccess();
  if ("response" in gate) return gate.response;
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const summary = await updateImportFields(
      id,
      parsed.data.corrections.map((c) => ({
        ...c,
        status: c.status as ExtractedFieldStatus | undefined,
      })),
    );
    const payload = await getInvoiceImportPayload(id);
    return NextResponse.json({ summary, payload });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 400 });
  }
}
