/**
 * LLM provider abstraction. The provider's ONLY job is to phrase an NPC's
 * reply from a KnowledgePacket — it never decides what is true. Swap
 * providers via COLDCASE_LLM_PROVIDER; "mock" (the default) needs no API
 * key and runs fully deterministically for local dev and tests.
 */
import type { KnowledgePacket } from "@/lib/engines/knowledge-packet";
import { createOpenAiCompatibleProvider } from "./providers/openai-compatible";
import { createAnthropicProvider } from "./providers/anthropic";

export interface NpcReplyRequest {
  packet: KnowledgePacket;
  playerQuestion: string;
}

export interface NpcReplyResult {
  text: string;
  /** Which lie, if any, the reply drew on — lets the game engine update stress/trust deterministically. */
  liedUsing?: string;
}

export interface LlmProvider {
  name: string;
  generateNpcReply(req: NpcReplyRequest): Promise<NpcReplyResult>;
}

/** Picks the most relevant known fact for a free-text question via keyword overlap. No invention. */
function pickRelevantFact(question: string, facts: string[]): string | null {
  const qWords = new Set(question.toLowerCase().match(/[a-z0-9']+/g) ?? []);
  let best: { fact: string; score: number } | null = null;
  for (const fact of facts) {
    const fWords = fact.toLowerCase().match(/[a-z0-9']+/g) ?? [];
    const score = fWords.filter((w) => qWords.has(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { fact, score };
  }
  return best?.fact ?? null;
}

/**
 * Deterministic mock provider: templated phrasing driven entirely by the
 * packet. It never has access to anything outside it, so by construction
 * it cannot hallucinate facts — useful as the reference implementation of
 * the anti-hallucination contract, and for tests/dev without an API key.
 */
export const mockProvider: LlmProvider = {
  name: "mock",
  async generateNpcReply({ packet, playerQuestion }) {
    if (packet.evidenceShown) {
      const relevantLie = packet.availableLies[0];
      if (relevantLie) {
        const verbs: Record<string, string> = {
          deny: `That's not true. I never said that.`,
          explain: `Okay — there's an explanation for that.`,
          panic: `I... I don't know what you want me to say.`,
          change_story: `Alright, fine. That's not quite what happened.`,
          reveal_information: `...You're right. I wasn't honest about that.`,
        };
        return {
          text: `${verbs[relevantLie.fallback]} (Regarding the ${packet.evidenceShown.type}: "${packet.evidenceShown.description}")`,
          liedUsing: relevantLie.falseClaim,
        };
      }
      return {
        text: `I see. Yes, that's consistent with what I told you — I was at ${packet.claimedLocation}.`,
      };
    }

    const fact = pickRelevantFact(playerQuestion, packet.knownFacts);
    if (fact) return { text: fact };

    const lie = packet.availableLies[0];
    if (lie && /where|location|you\b/i.test(playerQuestion)) {
      return { text: `I was at ${packet.claimedLocation}. ${lie.falseClaim}`, liedUsing: lie.falseClaim };
    }

    return { text: `I don't know anything about that.` };
  },
};

let overrideProvider: LlmProvider | null = null;
let cached: { key: string; provider: LlmProvider } | null = null;

export function getLlmProvider(): LlmProvider {
  if (overrideProvider) return overrideProvider;

  const configured = process.env.COLDCASE_LLM_PROVIDER ?? "mock";
  if (configured === "mock") return mockProvider;

  if (cached?.key === configured) return cached.provider;

  let provider: LlmProvider;
  if (configured === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('COLDCASE_LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set — falling back to "mock".');
      return mockProvider;
    }
    provider = createAnthropicProvider();
  } else if (configured === "openai-compatible") {
    provider = createOpenAiCompatibleProvider();
  } else {
    console.warn(`Unknown COLDCASE_LLM_PROVIDER "${configured}" — falling back to "mock".`);
    return mockProvider;
  }

  cached = { key: configured, provider };
  return provider;
}

/** Test-only escape hatch to inject a fake provider, bypassing env-based selection. */
export function setLlmProvider(provider: LlmProvider | null): void {
  overrideProvider = provider;
}
