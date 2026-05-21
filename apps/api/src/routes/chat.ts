import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { runAgent } from "@helia/agent";
import { defaultWorkspace } from "../lib/workspace";
import { log } from "../lib/state";
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
 */
chatRouter.post("/", zValidator("json", Body), async (c) => {
  const { messages } = c.req.valid("json");
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return c.json({ error: "no user message" }, 400);

  const ws = await defaultWorkspace();
  const tools = await makeAgentTools(ws.id);

  const result = runAgent({
    persona: { name: ws.name, locale: ws.locale },
    messages,
    tools,
    onError: (err) => log.error({ err }, "agent error"),
  });

  return result.toDataStreamResponse();
});
