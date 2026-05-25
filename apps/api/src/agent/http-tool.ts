import { tool } from "ai";
import { z, type ZodTypeAny } from "zod";
import type { Tool, ToolParam } from "@helia/db";
import { log } from "../lib/state";
import type { Identity } from "../routes/chat";
import { decryptHeaders } from "../lib/tool-headers";

/**
 * Build an AI SDK tool from a `tools` row.
 *
 * LLM-sourced params are exposed to the model and validated by Zod.
 * Context-sourced params are injected server-side from the verified
 * `identity` (HMAC-signed by the customer's backend). The model never
 * sees them and can't override them.
 */
export function buildHttpTool(t: Tool, identity: Identity | null) {
  return tool({
    description: t.description,
    parameters: buildZodSchema(t.paramsSchema),
    execute: async (args: Record<string, unknown>) => {
      const merged = withContextParams(t.paramsSchema, args, identity);
      if ("error" in merged) return merged;
      return callHttpEndpoint(t, merged.args);
    },
  });
}

/**
 * Server-side context source: pulls values from the verified identity.
 * Supported paths: `user.id`, `user.name`.
 *
 * If a tool declares a required context param and the identity is missing
 * or the path is unset, we refuse to call the endpoint (returns a
 * tool-visible error so the agent can recover gracefully).
 */
function withContextParams(
  params: ToolParam[],
  llmArgs: Record<string, unknown>,
  identity: Identity | null,
): { args: Record<string, unknown> } | { error: string } {
  const out: Record<string, unknown> = { ...llmArgs };
  for (const p of params) {
    if (p.source !== "context") continue;
    const value = lookupContext(p.contextPath, identity);
    if (value == null) {
      if (p.required) {
        return {
          error: `missing context value for "${p.name}" (needs ${p.contextPath ?? "?"})`,
        };
      }
      continue;
    }
    out[p.name] = value;
  }
  return { args: out };
}

function lookupContext(
  path: string | undefined,
  identity: Identity | null,
): string | null {
  if (!identity || !path) return null;
  switch (path) {
    case "user.id":
      return identity.id;
    case "user.name":
      return identity.name;
    default:
      return null;
  }
}

function buildZodSchema(
  params: ToolParam[],
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const p of params) {
    if (p.source !== "llm") continue; // context-sourced params handled later
    let s: ZodTypeAny = primitive(p.type);
    if (p.description) s = s.describe(p.description);
    if (!p.required) s = s.optional();
    shape[p.name] = s;
  }
  return z.object(shape);
}

function primitive(t: ToolParam["type"]): ZodTypeAny {
  switch (t) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
  }
}

async function callHttpEndpoint(
  t: Tool,
  args: Record<string, unknown>,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), t.timeoutMs);

  try {
    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent": "helia/0.1 (+https://helia.snowztech.com)",
      ...decryptHeaders(t.headers ?? {}),
    };

    let url = t.url;
    let body: string | undefined;

    if (t.method === "GET") {
      const u = new URL(t.url);
      for (const [k, v] of Object.entries(args)) {
        if (v != null) u.searchParams.set(k, String(v));
      }
      url = u.toString();
    } else {
      headers["content-type"] = "application/json";
      body = JSON.stringify(args);
    }

    const res = await fetch(url, {
      method: t.method,
      headers,
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      log.warn({ tool: t.name, status: res.status }, "http tool non-2xx");
      return { error: `tool returned HTTP ${res.status}` };
    }

    // Cap response size to avoid blowing up the context window.
    const reader = res.body?.getReader();
    if (!reader) return await safeJson(res);

    let read = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      if (read > t.maxResponseBytes) {
        reader.cancel().catch(() => {});
        return { error: `tool response over ${t.maxResponseBytes} bytes` };
      }
      chunks.push(value);
    }

    const text = new TextDecoder().decode(concat(chunks));
    try {
      return JSON.parse(text);
    } catch {
      return { error: "tool response was not JSON", body: text.slice(0, 500) };
    }
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? `timeout after ${t.timeoutMs}ms`
          : err.message
        : String(err);
    log.warn({ tool: t.name, err: msg }, "http tool failed");
    return { error: msg };
  } finally {
    clearTimeout(timer);
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { error: "tool response was not JSON" };
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
