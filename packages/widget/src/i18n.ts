/**
 * Tiny i18n for the widget's UI chrome. Only chrome strings — anything
 * the customer authored (greeting, suggestions, persona) is already in
 * their language because they wrote it.
 *
 * Two locales for v1: en + fr. To add another (es, de, ...), drop a
 * complete map below and the call sites stay unchanged. We don't load
 * locale data over the wire; everything ships with the bundle.
 */

export type Locale = "en" | "fr" | string;

type Strings = {
  openChat: string;
  closeChat: string;
  send: string;
  messageInput: string;
  searchingKnowledge: string;
  callingTool: (name: string) => string;
  somethingWentWrong: (msg: string) => string;
};

const EN: Strings = {
  openChat: "Open chat",
  closeChat: "Close chat",
  send: "Send",
  messageInput: "Message input",
  searchingKnowledge: "Searching your knowledge…",
  callingTool: (name) => `Calling ${name}…`,
  somethingWentWrong: (msg) => `Sorry, something went wrong: ${msg}`,
};

const FR: Strings = {
  openChat: "Ouvrir le chat",
  closeChat: "Fermer le chat",
  send: "Envoyer",
  messageInput: "Champ de message",
  searchingKnowledge: "Recherche dans votre base…",
  callingTool: (name) => `Appel de ${name}…`,
  somethingWentWrong: (msg) => `Désolé, une erreur s'est produite : ${msg}`,
};

const TABLES: Record<string, Strings> = { en: EN, fr: FR };

export function strings(locale: Locale | undefined): Strings {
  if (!locale) return EN;
  return TABLES[locale.toLowerCase()] ?? EN;
}
