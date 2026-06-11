import { prisma } from "@/lib/prisma";
import type { ExtractedFieldStatus } from "@/generated/prisma/enums";

export type FieldCorrection = {
  fieldKey: string;
  correctedValue?: string | null;
  status?: ExtractedFieldStatus;
  ignored?: boolean;
};

export async function updateExtractedFields(
  importId: string,
  corrections: FieldCorrection[],
): Promise<void> {
  for (const c of corrections) {
    const status: ExtractedFieldStatus = c.ignored
      ? "IGNORED"
      : c.correctedValue !== undefined
        ? "USER_CORRECTED"
        : c.status ?? "NEEDS_REVIEW";

    await prisma.invoiceExtractedField.updateMany({
      where: { invoiceImportId: importId, fieldKey: c.fieldKey },
      data: {
        correctedValue: c.correctedValue ?? undefined,
        status,
      },
    });
  }
}

export async function markFieldValidated(importId: string, fieldKey: string): Promise<void> {
  await prisma.invoiceExtractedField.updateMany({
    where: { invoiceImportId: importId, fieldKey },
    data: { status: "VALIDATED" },
  });
}

export async function getFieldReviewSummary(importId: string) {
  const fields = await prisma.invoiceExtractedField.findMany({
    where: { invoiceImportId: importId },
    select: { fieldKey: true, fieldLabel: true, extractedValue: true, correctedValue: true, confidence: true, status: true, source: true },
  });

  return {
    total: fields.length,
    needsReview: fields.filter((f) => f.status === "NEEDS_REVIEW" || Number(f.confidence) < 0.6).length,
    validated: fields.filter((f) => f.status === "VALIDATED" || f.status === "USER_CORRECTED").length,
    ignored: fields.filter((f) => f.status === "IGNORED").length,
    fields,
  };
}
