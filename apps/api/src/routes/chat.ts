import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { runAgent } from "@helia/agent";
import { chatTraces, workspaces, type Workspace } from "@helia/db";
import { eq } from "drizzle-orm";
import { db, log } from "../lib/state";
import { makeAgentTools } from "../agent/tools";
import { decrypt } from "../lib/crypto";
import { verifyIdentity } from "../lib/hmac";

export interface Identity {
  id: string;
  name: string | null;
}

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

  const ws = await resolveChatWorkspace(c);
  if (!ws) return c.json({ error: "workspace not found" }, 404);

  const identity = resolveIdentity(c, ws);
  if (identity === "invalid") {
    return c.json({ error: "invalid identity signature" }, 401);
  }
  if (identity === null && ws.identityRequired) {
    return c.json({ error: "identity required" }, 401);
  }

  const tools = await makeAgentTools(ws.id, identity);
  const startedAt = Date.now();

  const result = runAgent({
    persona: { name: ws.name, locale: ws.locale },
    messages,
    tools,
    model: { provider: "openai", model: ws.model },
    onError: (err) => log.error({ err }, "agent error"),
  });

  void persistTrace(result, ws, identity, lastUser.content, startedAt);

  return result.toDataStreamResponse();
});

/**
 * Verify the user identity headers if present.
 *  - Returns null if the headers are absent (anonymous flow).
 *  - Returns "invalid" if headers are present but don't verify, or if the
 *    workspace has no secret to verify against.
 *  - Returns the user identity object on success.
 */
function resolveIdentity(
  c: Context,
  ws: Workspace,
): Identity | null | "invalid" {
  const userHeader = c.req.header("x-helia-user");
  const signature = c.req.header("x-helia-signature");
  if (!userHeader && !signature) return null;
  if (!userHeader || !signature) return "invalid";

  let parsed: { id?: unknown; name?: unknown };
  try {
    parsed = JSON.parse(userHeader);
  } catch {
    return "invalid";
  }
  if (!parsed || typeof parsed.id !== "string" || parsed.id.length === 0) {
    return "invalid";
  }
  const name = typeof parsed.name === "string" ? parsed.name : null;

  if (!ws.identitySecret) return "invalid";

  let secret: string;
  try {
    secret = decrypt(ws.identitySecret);
  } catch (err) {
    log.error({ err, workspaceId: ws.id }, "identity secret decrypt failed");
    return "invalid";
  }

  const ok = verifyIdentity({ id: parsed.id, name }, signature, secret);
  if (!ok) return "invalid";
  return { id: parsed.id, name };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pick the workspace for this chat request. The embedded widget passes
 * `?ws=<uuid>` from its `data-workspace` attribute. As a convenience for
 * the admin preview (same-origin, logged in), fall back to the session's
 * workspace if no query param is provided.
 */
async function resolveChatWorkspace(c: Context): Promise<Workspace | null> {
  const wsParam = c.req.query("ws");
  if (wsParam && UUID_RE.test(wsParam)) {
    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, wsParam))
      .limit(1);
    return row ?? null;
  }

  const fromCtx = c.get("workspace") as Workspace | null | undefined;
  return fromCtx ?? null;
}

type AgentResult = ReturnType<typeof runAgent>;

async function persistTrace(
  result: AgentResult,
  ws: Workspace,
  identity: Identity | null,
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
      userId: identity?.id ?? null,
      userName: identity?.name ?? null,
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
