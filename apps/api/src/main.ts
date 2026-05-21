import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { CORS_ORIGIN, log } from "./lib/state";
import { sourcesRouter } from "./routes/sources";
import { chunksRouter } from "./routes/chunks";
import { chatRouter } from "./routes/chat";
import { healthRouter } from "./routes/health";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: CORS_ORIGIN,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["content-type", "authorization"],
    exposeHeaders: ["x-helia-sources"],
  }),
);

app.use("*", honoLogger((msg) => log.info(msg)));

app.get("/", (c) => c.json({ name: "helia-api", version: "0.0.1" }));

app.route("/v1/health", healthRouter);
app.route("/v1/sources", sourcesRouter);
app.route("/v1/chunks", chunksRouter);
app.route("/v1/chat", chatRouter);

app.onError((err, c) => {
  log.error({ err }, "unhandled error");
  return c.json({ error: err.message ?? "internal error" }, 500);
});

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  log.info(`helia-api listening on http://localhost:${info.port}`);
});

const shutdown = (signal: string) => {
  log.info({ signal }, "shutting down");
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
