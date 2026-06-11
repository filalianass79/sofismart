import type { AiExtractionResult } from "../../ai-extraction-schema";

export type AiExtractionInput = {
  rawOcrText: string;
  cleanedOcrText: string;
  ocrBlocks?: { text: string; confidence: number }[];
  fileName?: string;
  pageCount?: number;
};

export type AiExtractionOutput = {
  data: AiExtractionResult;
  rawResponse: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  isAvailable(): boolean;
  extractInvoiceData(input: AiExtractionInput): Promise<AiExtractionOutput>;
  estimateCost(input: AiExtractionInput): number;
}
