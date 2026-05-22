import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { runAgent } from "@helia/agent";
import { chatTraces, type Workspace } from "@helia/db";
import { defaultWorkspace } from "../lib/workspace";
import { db, log } from "../lib/state";
import { makeAgentTools } from "../agent/tools";

export const chatRouter = new Hono();

const Body = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
});

/**
 * POST /v1/chat
 *  - body : { messages: [{role, content}] }
 *  - resp : Vercel AI SDK data stream (interleaved text + tool calls)
 *
 * Composition:
 *   workspace → persona + tools → runAgent (from @helia/agent) → stream
 *
 * Side effect: a `chat_traces` row is written after the stream completes,
 * powering the admin dashboard.
 */
chatRouter.post("/", zValidator("json", Body), async (c) => {
  const { messages } = c.req.valid("json");
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return c.json({ error: "no user message" }, 400);

  const ws = await defaultWorkspace();
  const tools = await makeAgentTools(ws.id);
  const startedAt = Date.now();

  const result = runAgent({
    persona: { name: ws.name, locale: ws.locale },
    messages,
    tools,
    model: { provider: "openai", model: ws.model },
    onError: (err) => log.error({ err }, "agent error"),
  });

  // Persist a trace once the stream is consumed by the client. Fire-and-
  // forget: the response itself is what drives the stream, and the result
  // promises only resolve as the client reads. We don't await here.
  void persistTrace(result, ws, lastUser.content, startedAt);

  return result.toDataStreamResponse();
});

type AgentResult = ReturnType<typeof runAgent>;

async function persistTrace(
  result: AgentResult,
  ws: Workspace,
  userMessage: string,
  startedAt: number,
): Promise<void> {
  try {
    const [usage, steps, finalText] = await Promise.all([
      result.usage,
      result.steps,
      result.text,
    ]);

    const latencyMs = Date.now() - startedAt;
    const retrieval = extractRetrieval(steps);

    await db.insert(chatTraces).values({
      workspaceId: ws.id,
      userMessage,
      finalAnswer: finalText,
      totalTokens: usage?.totalTokens ?? 0,
      totalLatencyMs: latencyMs,
      model: ws.model,
      steps: steps as unknown[],
      retrieval,
    });
  } catch (err) {
    log.error({ err }, "trace persist failed");
  }
}

/**
 * Pull source titles out of any search_knowledge tool results in the agent
 * steps. Returns an empty array if the tool never fired.
 */
function extractRetrieval(
  steps: unknown,
): Array<{ title: string; url: string | null; score: number }> {
  if (!Array.isArray(steps)) return [];
  const out: Array<{ title: string; url: string | null; score: number }> = [];
  const seen = new Set<string>();

  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    const toolResults = (step as { toolResults?: unknown }).toolResults;
    if (!Array.isArray(toolResults)) continue;
    for (const tr of toolResults) {
      if (!tr || typeof tr !== "object") continue;
      const { toolName, result } = tr as {
        toolName?: string;
        result?: unknown;
      };
      if (toolName !== "search_knowledge") continue;
      if (!result || typeof result !== "object") continue;
      const r = result as { results?: unknown };
      if (!Array.isArray(r.results)) continue;
      for (const row of r.results) {
        if (!row || typeof row !== "object") continue;
        const o = row as { title?: unknown; url?: unknown; score?: unknown };
        const title = typeof o.title === "string" ? o.title : null;
        if (!title) continue;
        const url = typeof o.url === "string" ? o.url : null;
        const score = typeof o.score === "number" ? o.score : 0;
        const key = `${title}|${url ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ title, url, score });
      }
    }
  }
  return out;
}
