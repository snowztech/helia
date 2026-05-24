import "@helia/config"; // loads .env
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { CORS_POLICY, log } from "./lib/state";
import { sourcesRouter } from "./routes/sources";
import { chunksRouter } from "./routes/chunks";
import { chatRouter } from "./routes/chat";
import { healthRouter } from "./routes/health";
import { widgetRouter } from "./routes/widget";
import { workspaceRouter } from "./routes/workspace";
import { toolsRouter } from "./routes/tools";
import { systemRouter } from "./routes/system";
import { metricsRouter } from "./routes/metrics";
import { conversationsRouter } from "./routes/conversations";
import { authRouter } from "./routes/auth";
import { bansRouter } from "./routes/bans";
import { authMiddleware } from "./lib/auth";
import { rateLimit } from "./lib/rate-limit";

const app = new Hono();

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (CORS_POLICY.kind === "wildcard") return origin ?? "*";
      if (!origin) return null;
      if (CORS_POLICY.kind === "list") {
        return CORS_POLICY.origins.includes(origin) ? origin : null;
      }
      return LOCALHOST_RE.test(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "content-type",
      "authorization",
      "x-helia-user",
      "x-helia-signature",
    ],
    exposeHeaders: ["x-helia-sources"],
    credentials: true,
  }),
);

app.use("*", honoLogger((msg) => log.info(msg)));
app.use("/v1/*", authMiddleware);
// Public, agent-bound, expensive: protect against floods.
app.use("/v1/chat", rateLimit({ windowMs: 60_000, max: 30 }));

app.get("/", (c) => c.json({ name: "helia-api", version: "0.0.1" }));

app.route("/v1/health", healthRouter);
app.route("/v1/auth", authRouter);
app.route("/v1/sources", sourcesRouter);
app.route("/v1/chunks", chunksRouter);
app.route("/v1/chat", chatRouter);
app.route("/v1/widget", widgetRouter);
app.route("/v1/workspace", workspaceRouter);
app.route("/v1/tools", toolsRouter);
app.route("/v1/system", systemRouter);
app.route("/v1/metrics", metricsRouter);
app.route("/v1/conversations", conversationsRouter);
app.route("/v1/banned-users", bansRouter);

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
