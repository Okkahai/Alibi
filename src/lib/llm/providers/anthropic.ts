/**
 * Real Anthropic provider. Only meant to be selected once ANTHROPIC_API_KEY
 * is set — getLlmProvider() (src/lib/llm/provider.ts) falls back to mock
 * otherwise, so this module never runs without a key.
 */
import type { LlmProvider, NpcReplyRequest, NpcReplyResult } from "@/lib/llm/provider";
import { buildSystemPrompt } from "@/lib/llm/prompt";

export function createAnthropicProvider(): LlmProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("createAnthropicProvider() called without ANTHROPIC_API_KEY set.");
  const model = process.env.COLDCASE_ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";

  return {
    name: "anthropic",
    async generateNpcReply({ packet, playerQuestion }: NpcReplyRequest): Promise<NpcReplyResult> {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          system: buildSystemPrompt(packet),
          messages: [
            ...packet.conversationHistory.map((t) => ({
              role: t.speaker === "player" ? ("user" as const) : ("assistant" as const),
              content: t.text,
            })),
            { role: "user", content: playerQuestion },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic provider request failed: ${res.status} ${await res.text()}`);
      }
      const data = await res.json();
      const text = data?.content?.[0]?.text;
      if (typeof text !== "string") {
        throw new Error("Anthropic provider returned an unexpected response shape.");
      }
      return { text };
    },
  };
}
