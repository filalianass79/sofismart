import { SYSTEM_PROMPT, aiExtractionSchema, type AiExtractionResult } from "../../ai-extraction-schema";
import type { AiExtractionInput } from "./types";

export const JSON_SCHEMA_HINT = `{
  "supplier": { "name": "", "ice": "", "rc": "", "taxId": "", "phone": "", "address": "", "city": "", "country": "" },
  "invoice": { "invoiceNumber": "", "invoiceDate": "", "deliveryDate": "", "purchaseOrderNumber": "", "deliveryNoteNumber": "", "currency": "MAD", "amountHT": 0, "taxAmount": 0, "amountTTC": 0, "discount": 0, "netToPay": 0 },
  "vehicle": { "brand": "", "model": "", "version": "", "year": null, "color": "", "vin": "", "registrationNumber": "", "mileage": null, "fuelType": "", "gearbox": "" },
  "lineItems": [{ "designation": "", "quantity": 1, "unitPriceHT": 0, "discount": 0, "taxRate": 20, "taxAmount": 0, "totalHT": 0, "totalTTC": 0, "lineType": "VEHICLE" }],
  "payment": { "paymentMethod": "", "paidAmount": 0, "remainingAmount": 0 },
  "confidence": { "global": 0, "fields": {} },
  "warnings": []
}`;

export type AiRuntimeConfig = {
  enabled: boolean;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

export function isAiEnabledGlobally(): boolean {
  return process.env.AI_EXTRACTION_ENABLED === "true";
}

export function resolveProviderName(): string {
  return (process.env.AI_PROVIDER ?? "openai").toLowerCase();
}

export function resolveApiKey(provider: string): string {
  if (process.env.AI_API_KEY?.trim()) return process.env.AI_API_KEY.trim();
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY?.trim() ?? "";
    case "claude":
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
    case "gemini":
    case "google":
      return process.env.GEMINI_API_KEY?.trim() ?? process.env.GOOGLE_AI_API_KEY?.trim() ?? "";
    default:
      return "";
  }
}

export function defaultModelForProvider(provider: string): string {
  switch (provider) {
    case "claude":
    case "anthropic":
      return "claude-3-5-haiku-latest";
    case "gemini":
    case "google":
      return "gemini-2.0-flash";
    default:
      return "gpt-4o-mini";
  }
}

export function getAiRuntimeConfig(provider: string): AiRuntimeConfig {
  return {
    enabled: isAiEnabledGlobally(),
    apiKey: resolveApiKey(provider),
    model: process.env.AI_MODEL?.trim() || defaultModelForProvider(provider),
    maxTokens: Number(process.env.AI_MAX_TOKENS ?? 4000),
    temperature: Number(process.env.AI_TEMPERATURE ?? 0),
  };
}

export function buildUserPrompt(input: AiExtractionInput): string {
  const blocksContext = input.ocrBlocks?.length
    ? `\n\nBlocs OCR (confiance):\n${input.ocrBlocks
        .slice(0, 40)
        .map((b) => `- [${Math.round(b.confidence)}%] ${b.text}`)
        .join("\n")}`
    : "";

  return `Extrais les données de cette facture d'achat véhicule (Maroc).

Schéma JSON attendu:
${JSON_SCHEMA_HINT}

Texte OCR nettoyé:
---
${input.cleanedOcrText.slice(0, 12000)}
---${blocksContext}`;
}

export function parseJsonFromResponse(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(jsonStr);
}

export function parseAiResult(rawResponse: string): AiExtractionResult {
  const parsed = parseJsonFromResponse(rawResponse);
  return aiExtractionSchema.parse(parsed) as AiExtractionResult;
}

export function estimateTokenCost(
  input: AiExtractionInput,
  provider: string,
): { inputTokens: number; outputTokens: number; estimatedCost: number } {
  const inputTokens = Math.ceil(input.cleanedOcrText.length / 4) + 500;
  const outputTokens = 1500;
  let estimatedCost = 0;

  switch (provider) {
    case "claude":
    case "anthropic":
      estimatedCost = inputTokens * 0.00000025 + outputTokens * 0.00000125;
      break;
    case "gemini":
    case "google":
      estimatedCost = inputTokens * 0.0000001 + outputTokens * 0.0000004;
      break;
    default:
      estimatedCost = inputTokens * 0.00000015 + outputTokens * 0.0000006;
  }

  return { inputTokens, outputTokens, estimatedCost };
}

export { SYSTEM_PROMPT };
