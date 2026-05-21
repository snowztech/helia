import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { buildAgentPrompt } from "./persona";
import type { RunAgentOptions } from "./types";

/**
 * Single-turn agent loop.
 *
 *  1. Build the system prompt from persona + tool descriptions.
 *  2. Hand off to Vercel AI SDK `streamText` with tools + `maxSteps`.
 *  3. AI SDK drives the LLM ↔ tool round-trips internally, emitting:
 *     - `text-delta`        — model output tokens
 *     - `tool-call`         — model invoked a tool
 *     - `tool-result`       — tool finished, result fed back to the model
 *     - `step-start/finish` — boundaries between LLM round-trips
 *
 * Callers turn the returned result into:
 *   - HTTP: `result.toDataStreamResponse()` (Hono / Next / any fetch handler)
 *   - In-process: `await result.text` for the full final answer
 *
 * `maxSteps` caps how many LLM ↔ tool loops happen per turn. 5 is enough for
 * typical support flows. Increase if you wire multi-tool plans.
 */
export function runAgent(opts: RunAgentOptions) {
  const {
    persona,
    messages,
    tools,
    model = { provider: "openai", model: "gpt-4o-mini" },
    maxSteps = 5,
    temperature = 0.2,
    onError,
  } = opts;

  const system = buildAgentPrompt({
    ...persona,
    toolDescriptions:
      persona.toolDescriptions ??
      (tools
        ? Object.entries(tools).map(([name, t]) => ({
            name,
            description: (t.description as string) ?? "(no description)",
          }))
        : undefined),
  });

  return streamText({
    model: pickModel(model),
    system,
    messages,
    tools,
    maxSteps,
    temperature,
    ...(onError ? { onError: ({ error }) => onError(error) } : {}),
  });
}

function pickModel(choice: NonNullable<RunAgentOptions["model"]>) {
  switch (choice.provider) {
    case "openai":
      return openai(choice.model);
    default: {
      const _exhaustive: never = choice.provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}
