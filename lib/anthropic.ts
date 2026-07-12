import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

export function createAnthropic() {
  return new Anthropic();
}
