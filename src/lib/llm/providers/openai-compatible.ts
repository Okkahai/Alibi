/**
 * Works with any OpenAI-compatible chat completions endpoint — Ollama,
 * LM Studio, vLLM, OpenAI itself, etc. No API key needed for a local
 * endpoint like Ollama (COLDCASE_OPENAI_API_KEY is optional).
 */
import type { LlmProvider, NpcReplyRequest, NpcReplyResult } from "@/lib/llm/provider";
import { buildSystemPrompt } from "@/lib/llm/prompt";

export function createOpenAiCompatibleProvider(): LlmProvider {
  const baseUrl = process.env.COLDCASE_OPENAI_BASE_URL ?? "http://localhost:11434/v1";
  const model = process.env.COLDCASE_OPENAI_MODEL ?? "llama3";
  const apiKey = process.env.COLDCASE_OPENAI_API_KEY;

  return {
    name: "openai-compatible",
    async generateNpcReply({ packet, playerQuestion }: NpcReplyRequest): Promise<NpcReplyResult> {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: buildSystemPrompt(packet) },
            ...packet.conversationHistory.map((t) => ({
              role: t.speaker === "player" ? ("user" as const) : ("assistant" as const),
              content: t.text,
            })),
            { role: "user", content: playerQuestion },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI-compatible provider request failed: ${res.status} ${await res.text()}`);
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        throw new Error("OpenAI-compatible provider returned an unexpected response shape.");
      }
      return { text };
    },
  };
}
