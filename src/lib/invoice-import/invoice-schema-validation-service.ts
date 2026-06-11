import { aiExtractionSchema, type AiExtractionResult } from "./ai-extraction-schema";

export type ValidationResult = {
  success: boolean;
  data: AiExtractionResult;
  errors: string[];
};

export function validateAiExtraction(raw: unknown): ValidationResult {
  const parsed = aiExtractionSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data, errors: parsed.data.warnings };
  }
  const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  const partial = aiExtractionSchema.safeParse({});
  return {
    success: false,
    data: partial.success ? partial.data : ({} as AiExtractionResult),
    errors,
  };
}
