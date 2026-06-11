import type { AIProvider, AiExtractionInput, AiExtractionOutput } from "./types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  estimateTokenCost,
  getAiRuntimeConfig,
  parseAiResult,
} from "./shared";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  readonly model: string;
  private readonly cfg;

  constructor() {
    this.cfg = getAiRuntimeConfig("claude");
    this.model = this.cfg.model;
  }

  isAvailable(): boolean {
    return this.cfg.enabled && this.cfg.apiKey.length > 10;
  }

  estimateCost(input: AiExtractionInput): number {
    return estimateTokenCost(input, "claude").estimatedCost;
  }

  async extractInvoiceData(input: AiExtractionInput): Promise<AiExtractionOutput> {
    if (!this.isAvailable()) {
      throw new Error("Extraction Claude désactivée ou ANTHROPIC_API_KEY manquante");
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.cfg.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.cfg.model,
        max_tokens: this.cfg.maxTokens,
        temperature: this.cfg.temperature,
        system: `${SYSTEM_PROMPT}\n\nRéponds uniquement avec un objet JSON valide.`,
        messages: [{ role: "user", content: buildUserPrompt(input) }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API ${res.status}: ${errText.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const rawResponse =
      json.content?.find((c) => c.type === "text")?.text ?? "{}";
    const data = parseAiResult(rawResponse);
    const cost = estimateTokenCost(input, "claude");

    return {
      data,
      rawResponse,
      inputTokens: json.usage?.input_tokens ?? cost.inputTokens,
      outputTokens: json.usage?.output_tokens ?? cost.outputTokens,
      estimatedCost: cost.estimatedCost,
    };
  }
}
