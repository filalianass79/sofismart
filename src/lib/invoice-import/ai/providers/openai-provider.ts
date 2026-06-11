import type { AIProvider, AiExtractionInput, AiExtractionOutput } from "./types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  estimateTokenCost,
  getAiRuntimeConfig,
  parseAiResult,
} from "./shared";

export class OpenAiProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly cfg;

  constructor() {
    this.cfg = getAiRuntimeConfig("openai");
    this.model = this.cfg.model;
  }

  isAvailable(): boolean {
    return this.cfg.enabled && this.cfg.apiKey.length > 10;
  }

  estimateCost(input: AiExtractionInput): number {
    return estimateTokenCost(input, "openai").estimatedCost;
  }

  async extractInvoiceData(input: AiExtractionInput): Promise<AiExtractionOutput> {
    if (!this.isAvailable()) {
      throw new Error("Extraction OpenAI désactivée ou clé API manquante");
    }

    const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        temperature: this.cfg.temperature,
        max_tokens: this.cfg.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const rawResponse = json.choices?.[0]?.message?.content ?? "{}";
    const data = parseAiResult(rawResponse);
    const cost = estimateTokenCost(input, "openai");

    return {
      data,
      rawResponse,
      inputTokens: json.usage?.prompt_tokens ?? cost.inputTokens,
      outputTokens: json.usage?.completion_tokens ?? cost.outputTokens,
      estimatedCost: cost.estimatedCost,
    };
  }
}
