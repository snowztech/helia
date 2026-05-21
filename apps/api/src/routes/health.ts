import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../lib/state";

export const healthRouter = new Hono();

healthRouter.get("/", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ ok: true, db: "up" });
  } catch (err) {
    return c.json({ ok: false, db: "down", error: String(err) }, 503);
  }
});
