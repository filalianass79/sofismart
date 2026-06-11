import { prisma } from "@/lib/prisma";
import { createAiProvider, listAvailableProviders } from "./ai/providers/create-provider";
import type { AiExtractionInput } from "./ai/providers/types";
import type { AiExtractionResult } from "./ai-extraction-schema";
import { validateAiExtraction } from "./invoice-schema-validation-service";

const MAX_AI_RUNS_PER_USER_PER_DAY = Number(process.env.AI_MAX_RUNS_PER_USER_PER_DAY ?? 50);

export function isAiExtractionEnabled(): boolean {
  const provider = createAiProvider();
  return provider.isAvailable();
}

export function getAiProviderInfo() {
  const active = createAiProvider();
  return {
    activeProvider: active.name,
    activeModel: active.model,
    enabled: isAiExtractionEnabled(),
    providers: listAvailableProviders(),
  };
}

export async function checkAiRateLimit(userId: string | null): Promise<void> {
  if (!userId) return;
  const since = new Date();
  since.setHours(since.getHours() - 24);
  const count = await prisma.invoiceExtractionRun.count({
    where: {
      type: "AI",
      status: "SUCCESS",
      startedAt: { gte: since },
      invoiceImport: { uploadedById: userId },
    },
  });
  if (count >= MAX_AI_RUNS_PER_USER_PER_DAY) {
    throw new Error(`Limite d'extractions IA atteinte (${MAX_AI_RUNS_PER_USER_PER_DAY}/jour)`);
  }
}

export async function runAiExtraction(
  importId: string,
  input: AiExtractionInput,
  userId: string | null,
): Promise<{ data: AiExtractionResult; rawResponse: string; validationErrors: string[] }> {
  await checkAiRateLimit(userId);
  const provider = createAiProvider();

  if (!provider.isAvailable()) {
    throw new Error("Extraction IA désactivée — configurez AI_EXTRACTION_ENABLED et AI_API_KEY");
  }

  const run = await prisma.invoiceExtractionRun.create({
    data: {
      invoiceImportId: importId,
      type: "AI",
      provider: provider.name,
      model: provider.model,
      status: "RUNNING",
    },
  });

  try {
    const output = await provider.extractInvoiceData(input);
    const validation = validateAiExtraction(output.data);

    await prisma.invoiceExtractionRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
        estimatedCost: output.estimatedCost,
        finishedAt: new Date(),
      },
    });

    return {
      data: validation.data,
      rawResponse: output.rawResponse,
      validationErrors: validation.errors,
    };
  } catch (e) {
    await prisma.invoiceExtractionRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message : "Erreur IA",
        finishedAt: new Date(),
      },
    });
    throw e;
  }
}
