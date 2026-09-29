import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import { createOpenAiCompatibleProvider } from "@/lib/llm/providers/openai-compatible";
import { createAnthropicProvider } from "@/lib/llm/providers/anthropic";
import type { KnowledgePacket } from "@/lib/engines/knowledge-packet";

/**
 * These providers call a real HTTP endpoint, so they're tested against a
 * stubbed local server rather than the live OpenAI/Anthropic APIs — no
 * network access or API key needed to run this suite. A real Anthropic key
 * would additionally need validating with the groundedness-sweep pattern
 * from __tests__/npc-dialogue-engine.test.ts before being trusted in
 * production; that's noted in docs/06-anti-hallucination.md.
 */

const packet: KnowledgePacket = {
  character: { name: "Marcus Reed", role: "suspect", personality: "Charming.", relationshipToVictim: "Business partner", stress: 0.3, trust: 0.6 },
  knownFacts: ["Richard confronted him about missing funds."],
  availableLies: [],
  claimedLocation: "Garden Terrace",
  conversationHistory: [],
  evidenceShown: null,
};

async function withStubServer(
  respond: (body: unknown) => { status?: number; body: unknown },
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  let received: unknown = null;
  const server: Server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      received = JSON.parse(raw);
      const { status = 200, body } = respond(received);
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = typeof address === "object" && address ? `http://127.0.0.1:${address.port}` : "";
  try {
    await run(baseUrl);
  } finally {
    server.close();
  }
  expect(received).not.toBeNull();
}

describe("OpenAI-compatible provider (works with Ollama et al.)", () => {
  afterEach(() => {
    delete process.env.COLDCASE_OPENAI_BASE_URL;
  });

  it("posts the packet as a constrained system prompt and parses the reply", async () => {
    await withStubServer(
      (body) => {
        const b = body as { model: string; messages: Array<{ role: string; content: string }> };
        expect(b.messages[0].role).toBe("system");
        expect(b.messages[0].content).toContain("Marcus Reed");
        expect(b.messages[0].content).toContain("Richard confronted him about missing funds.");
        return { body: { choices: [{ message: { content: "I was at the terrace all night." } }] } };
      },
      async (baseUrl) => {
        process.env.COLDCASE_OPENAI_BASE_URL = baseUrl;
        const provider = createOpenAiCompatibleProvider();
        const result = await provider.generateNpcReply({ packet, playerQuestion: "Where were you?" });
        expect(result.text).toBe("I was at the terrace all night.");
      }
    );
  });

  it("throws a clear error on a non-2xx response", async () => {
    await withStubServer(
      () => ({ status: 500, body: { error: "boom" } }),
      async (baseUrl) => {
        process.env.COLDCASE_OPENAI_BASE_URL = baseUrl;
        const provider = createOpenAiCompatibleProvider();
        await expect(provider.generateNpcReply({ packet, playerQuestion: "?" })).rejects.toThrow(/500/);
      }
    );
  });
});

describe("Anthropic provider", () => {
  it("refuses to construct without ANTHROPIC_API_KEY", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(() => createAnthropicProvider()).toThrow(/ANTHROPIC_API_KEY/);
    } finally {
      if (original) process.env.ANTHROPIC_API_KEY = original;
    }
  });

  it("sends the packet as a system prompt and parses the reply, given a key", async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-key";
    try {
      // Anthropic's real endpoint is hardcoded (api.anthropic.com), so this
      // test only exercises request construction + response parsing against
      // a mocked global fetch rather than a local stub server.
      const originalFetch = global.fetch;
      global.fetch = (async (url: string, init: RequestInit) => {
        expect(url).toBe("https://api.anthropic.com/v1/messages");
        const body = JSON.parse(init.body as string);
        expect(body.system).toContain("Marcus Reed");
        return new Response(JSON.stringify({ content: [{ text: "I wasn't near the study." }] }), { status: 200 });
      }) as typeof fetch;

      try {
        const provider = createAnthropicProvider();
        const result = await provider.generateNpcReply({ packet, playerQuestion: "Where were you?" });
        expect(result.text).toBe("I wasn't near the study.");
      } finally {
        global.fetch = originalFetch;
      }
    } finally {
      if (original) process.env.ANTHROPIC_API_KEY = original;
      else delete process.env.ANTHROPIC_API_KEY;
    }
  });
});
