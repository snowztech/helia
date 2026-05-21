import type { CoreMessage, Tool } from "ai";

/**
 * Public-facing agent types. Kept thin on purpose — the heavy lifting
 * (streaming, tool dispatch) is delegated to the Vercel AI SDK.
 */

export type AgentMessage = CoreMessage;

/** Type-erased tool record, indexed by the name the model sees. */
export type AgentToolSet = Record<string, Tool>;

export type ModelChoice =
  | { provider: "openai"; model: "gpt-4o-mini" | "gpt-4o" | (string & {}) };

export type RunAgentOptions = {
  /** Identity + behaviour. */
  persona: AgentPersona;

  /** Conversation so far. The last message should be from the user. */
  messages: AgentMessage[];

  /** Tools the model can call this turn. */
  tools?: AgentToolSet;

  /** Model selection. Defaults to OpenAI gpt-4o-mini. */
  model?: ModelChoice;

  /** Hard cap on tool-call/response loops per turn. Default 5. */
  maxSteps?: number;

  /** 0..1, controls randomness. Default 0.2 for factual support. */
  temperature?: number;

  /** Optional hook for structured error logging. */
  onError?: (err: unknown) => void;
};

export type AgentPersona = {
  /** Business or product name the agent represents. */
  name: string;
  /** BCP-47 locale used to anchor reply language. */
  locale: string;
  /** Optional tone hint, e.g. "formal", "warm". */
  tone?: string;
  /** Names of tools available, used to render their descriptions in the prompt. */
  toolDescriptions?: Array<{ name: string; description: string }>;
  /** Optional extra instructions appended verbatim to the system prompt. */
  extraInstructions?: string;
};
