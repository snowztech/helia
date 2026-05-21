import type { RetrievedChunk } from "./retrieve";

export type AgentConfig = {
  name: string;
  locale: string;
  tone?: string;
  systemPromptExtra?: string;
};

/**
 * Build the system prompt for the chat agent.
 *
 * Design notes:
 *  - Forces "answer only from sources" to limit hallucinations.
 *  - Demands citations like [Source 1] for verifiability.
 *  - Tells the model how to behave when no information is found
 *    (say so, propose contact). Without this, models invent answers.
 *  - Locale instruction in the same language as the target output to anchor
 *    the model.
 */
export function buildSystemPrompt(
  agent: AgentConfig,
  chunks: RetrievedChunk[],
): string {
  const langInstr =
    agent.locale === "fr"
      ? "Réponds en français."
      : agent.locale === "en"
        ? "Answer in English."
        : `Reply in the locale "${agent.locale}".`;

  const tone = agent.tone ? ` Ton: ${agent.tone}.` : "";

  const sources = chunks
    .map((c, i) => {
      const title = c.metadata?.docTitle ?? c.metadata?.url ?? "source";
      return `[Source ${i + 1} — ${title}]\n${c.content}`;
    })
    .join("\n\n---\n\n");

  const noContext = chunks.length === 0;

  return [
    `You are ${agent.name}, an assistant for a specific business.`,
    `${langInstr}${tone}`,
    `Answer ONLY from the information below. If the answer is not present, say so honestly and suggest contacting the business directly. Never invent facts.`,
    `When you state a fact, cite the source like [Source 1].`,
    agent.systemPromptExtra ?? "",
    "",
    noContext
      ? "No relevant information was found in the knowledge base."
      : `Information available:\n\n${sources}`,
  ]
    .filter(Boolean)
    .join("\n");
}
