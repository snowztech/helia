import { tool } from "ai";
import { z, type ZodTypeAny } from "zod";
import type { Tool, ToolParam } from "@helia/db";
import { log } from "../lib/state";

/**
 * Build an AI SDK tool from a `tools` row.
 *
 * The execute step POSTs the LLM-supplied args (filtered to "llm"-sourced
 * params) to the configured URL. Context-sourced params are reserved for
 * the JWT phase and ignored here.
 */
export function buildHttpTool(t: Tool) {
  return tool({
    description: t.description,
    parameters: buildZodSchema(t.paramsSchema),
    execute: async (args: Record<string, unknown>) => {
      return callHttpEndpoint(t, args);
    },
  });
}

function buildZodSchema(params: ToolParam[]): z.ZodObject<Record<string, ZodTypeAny>> {
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
      ...(t.headers ?? {}),
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
