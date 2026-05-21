import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { chunks } from "@helia/db";
import { db } from "../lib/state";

export const chunksRouter = new Hono();

/**
 * GET /v1/chunks/:id — return a single chunk's content + metadata.
 * Used by the chat UI to let users inspect the exact text the model saw.
 */
chunksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select({
      id: chunks.id,
      sourceId: chunks.sourceId,
      content: chunks.content,
      tokens: chunks.tokens,
      metadata: chunks.metadata,
    })
    .from(chunks)
    .where(eq(chunks.id, id))
    .limit(1);

  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ chunk: row });
});
