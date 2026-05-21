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
