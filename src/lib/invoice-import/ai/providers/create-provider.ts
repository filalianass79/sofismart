import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { OpenAiProvider } from "./openai-provider";
import { resolveProviderName } from "./shared";
import type { AIProvider } from "./types";

export function createAiProvider(): AIProvider {
  const provider = resolveProviderName();

  switch (provider) {
    case "claude":
    case "anthropic":
      return new ClaudeProvider();
    case "gemini":
    case "google":
      return new GeminiProvider();
    case "openai":
    default:
      return new OpenAiProvider();
  }
}

export function listAvailableProviders(): { id: string; label: string; available: boolean; model: string }[] {
  const providers = [
    new OpenAiProvider(),
    new ClaudeProvider(),
    new GeminiProvider(),
  ];
  return providers.map((p) => ({
    id: p.name,
    label: p.name === "openai" ? "OpenAI" : p.name === "claude" ? "Claude (Anthropic)" : "Gemini (Google)",
    available: p.isAvailable(),
    model: p.model,
  }));
}
