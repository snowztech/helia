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

  const hasKnowledge = (persona.toolDescriptions ?? []).some(
    (t) => t.name === "search_knowledge",
  );

  const knowledgeRule = hasKnowledge
    ? [
        "  • You have `search_knowledge` which searches the business's own documents and pages. You MUST call it for any user question about a product, service, person, document, feature, price, policy, endpoint, name, or any specific topic — even if you think you know the answer. The business's documents are the source of truth, not your training data.",
        "  • Do NOT say 'I don't have information about X' until you have called `search_knowledge` at least once and the results were empty or off-topic. If the first query returns nothing useful, try one more call with different keywords before giving up.",
        "  • Skip `search_knowledge` only for pure greetings ('hi', 'thanks'), smalltalk, or meta questions about yourself.",
      ].join("\n")
    : "  • You have no knowledge base this turn — answer from what you know, and say so if you don't.";

  return [
    `You are the AI assistant for ${persona.name}.`,
    langInstr,
    tone,
    "",
    toolsBlock,
    "Operating rules:",
    knowledgeRule,
    "  • Call other tools when the user asks for an action they enable (lookups, bookings, etc.).",
    "  • If a tool returns nothing useful, say honestly that you don't have that detail and suggest contacting the business. Never invent facts.",
    "  • When you cite information that came from a tool result, reference the source by its index, e.g. [Source 1].",
    "  • Keep answers concise. Small businesses don't want walls of text.",
    persona.extraInstructions ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}
