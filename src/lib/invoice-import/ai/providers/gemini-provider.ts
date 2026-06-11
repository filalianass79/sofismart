import type { AIProvider, AiExtractionInput, AiExtractionOutput } from "./types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  estimateTokenCost,
  getAiRuntimeConfig,
  parseAiResult,
} from "./shared";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly model: string;
  private readonly cfg;

  constructor() {
    this.cfg = getAiRuntimeConfig("gemini");
    this.model = this.cfg.model;
  }

  isAvailable(): boolean {
    return this.cfg.enabled && this.cfg.apiKey.length > 10;
  }

  estimateCost(input: AiExtractionInput): number {
    return estimateTokenCost(input, "gemini").estimatedCost;
  }

  async extractInvoiceData(input: AiExtractionInput): Promise<AiExtractionOutput> {
    if (!this.isAvailable()) {
      throw new Error("Extraction Gemini désactivée ou GEMINI_API_KEY manquante");
    }

    const model = encodeURIComponent(this.cfg.model);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.cfg.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${SYSTEM_PROMPT}\n\nRéponds uniquement avec un objet JSON valide.` }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserPrompt(input) }],
          },
        ],
        generationConfig: {
          temperature: this.cfg.temperature,
          maxOutputTokens: this.cfg.maxTokens,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    const rawResponse = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const data = parseAiResult(rawResponse);
    const cost = estimateTokenCost(input, "gemini");

    return {
      data,
      rawResponse,
      inputTokens: json.usageMetadata?.promptTokenCount ?? cost.inputTokens,
      outputTokens: json.usageMetadata?.candidatesTokenCount ?? cost.outputTokens,
      estimatedCost: cost.estimatedCost,
    };
  }
}
