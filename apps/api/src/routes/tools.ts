import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { tools as toolsTable } from "@helia/db";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../lib/state";
import { currentWorkspace } from "../lib/auth";

export const toolsRouter = new Hono();

const ParamSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "use letters, numbers, underscore"),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string().max(200),
  required: z.boolean(),
  source: z.enum(["llm", "context"]),
  contextPath: z.string().optional(),
});

const Body = z.object({
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, "snake_case identifier, e.g. get_orders"),
  description: z.string().min(1).max(280),
  url: z.string().url(),
  method: z.enum(["GET", "POST"]).default("POST"),
  paramsSchema: z.array(ParamSchema).default([]),
  headers: z.record(z.string()).default({}),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
  maxResponseBytes: z
    .number()
    .int()
    .min(1024)
    .max(1024 * 1024)
    .default(102400),
  enabled: z.boolean().default(true),
});

toolsRouter.get("/", async (c) => {
  const ws = currentWorkspace(c);
  const rows = await db
    .select()
    .from(toolsTable)
    .where(eq(toolsTable.workspaceId, ws.id))
    .orderBy(asc(toolsTable.createdAt));
  return c.json({ tools: rows });
});

toolsRouter.post("/", zValidator("json", Body), async (c) => {
  const ws = currentWorkspace(c);
  const body = c.req.valid("json");
  const [created] = await db
    .insert(toolsTable)
    .values({ ...body, workspaceId: ws.id })
    .returning();
  return c.json({ tool: created }, 201);
});

toolsRouter.patch(
  "/:id",
  zValidator("json", Body.partial()),
  async (c) => {
    const ws = currentWorkspace(c);
    const id = c.req.param("id");
    const patch = c.req.valid("json");
    const [updated] = await db
      .update(toolsTable)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(toolsTable.id, id), eq(toolsTable.workspaceId, ws.id)))
      .returning();
    if (!updated) return c.json({ error: "tool not found" }, 404);
    return c.json({ tool: updated });
  },
);

toolsRouter.delete("/:id", async (c) => {
  const ws = currentWorkspace(c);
  const id = c.req.param("id");
  const [deleted] = await db
    .delete(toolsTable)
    .where(and(eq(toolsTable.id, id), eq(toolsTable.workspaceId, ws.id)))
    .returning({ id: toolsTable.id });
  if (!deleted) return c.json({ error: "tool not found" }, 404);
  return c.json({ ok: true });
});
