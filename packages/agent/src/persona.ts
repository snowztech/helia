import type { AgentPersona } from "./types";

/**
 * Build the agent system prompt from a persona.
 *
 * The prompt teaches the model:
 *  1. Who it speaks for (business name + tone).
 *  2. What language to reply in (locale).
 *  3. What tools exist and the rules for calling them.
 *  4. How to behave when no tool answers the question (admit it).
 *
 * Tool descriptions are injected dynamically — when you add a new tool you
 * pass it in `persona.toolDescriptions` and the prompt stays in sync.
 */
export function buildAgentPrompt(persona: AgentPersona): string {
  const langInstr =
    persona.locale === "fr"
      ? "Réponds dans la même langue que l'utilisateur — par défaut le français."
      : persona.locale === "en"
        ? "Reply in the same language the user wrote in — English by default."
        : `Reply in the locale "${persona.locale}".`;

  const tone = persona.tone ? `Tone: ${persona.tone}.` : "";

  const toolsBlock =
    persona.toolDescriptions && persona.toolDescriptions.length > 0
      ? [
          "You have these tools:",
          ...persona.toolDescriptions.map(
            (t) => `  • ${t.name} — ${t.description}`,
          ),
          "",
        ].join("\n")
      : "You have no tools this turn — answer directly from what you know.\n";

  return [
    `You are the AI assistant for ${persona.name}.`,
    langInstr,
    tone,
    "",
    toolsBlock,
    "Operating rules:",
    "  • For greetings, smalltalk, clarifying questions, or meta questions about yourself, reply directly — do not call any tool.",
    "  • For factual questions, prefer calling a relevant tool over guessing. You may call a tool multiple times with different queries if the first results are not relevant.",
    "  • If no tool returns useful information, say honestly that you don't have that information and suggest contacting the business. Never invent facts.",
    "  • When you cite information that came from a tool result, reference the source by its index, e.g. [Source 1].",
    "  • Keep answers concise. Small businesses don't want walls of text.",
    persona.extraInstructions ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}
