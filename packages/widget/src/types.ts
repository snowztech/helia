export interface WidgetConfig {
  workspace: string;
  apiUrl?: string;
  botName?: string;
  greeting?: string;
}

export interface WidgetHandle {
  destroy: () => void;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Identity claim passed by the host page after their backend has HMAC-
 * signed it. The widget never generates this on its own; the customer's
 * server returns it.
 */
export interface Identity {
  id: string;
  name?: string;
  signature: string;
}
