import { baseStyles } from "./styles";
import { streamChat } from "./stream";
import { loadRemoteConfig, type RemoteConfig } from "./config";
import type { ChatMessage, WidgetConfig, WidgetHandle } from "./types";

const HOST_ID = "helia-widget";
const DEFAULT_API_URL = "http://localhost:4000";

interface State {
  open: boolean;
  streaming: boolean;
  messages: ChatMessage[];
  position: "right" | "left";
}

export function mount(config: WidgetConfig): WidgetHandle {
  if (document.getElementById(HOST_ID)) {
    const existing = document.getElementById(HOST_ID);
    return { destroy: () => existing?.remove() };
  }

  const apiUrl = config.apiUrl ?? DEFAULT_API_URL;

  let botName = config.botName ?? "Assistant";
  let greeting = config.greeting ?? "Hi, how can I help?";
  let placeholder = "Ask a question...";

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.dataset.workspace = config.workspace;
  document.body.appendChild(host);

  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = baseStyles;
  root.appendChild(style);

  const hostEl = root.host as HTMLElement;

  // --- Launcher
  const launcher = document.createElement("button");
  launcher.className = "launcher right";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerHTML = chatIcon();
  root.appendChild(launcher);

  // --- Panel
  const panel = document.createElement("div");
  panel.className = "panel right";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", `${botName} chat`);
  panel.innerHTML = `
    <div class="header">
      <div class="header-text">
        <div class="header-title">${escapeHtml(botName)}</div>
        <div class="header-subtitle"></div>
      </div>
      <button class="close" type="button" aria-label="Close chat">${closeIcon()}</button>
    </div>
    <div class="messages" role="log" aria-live="polite"></div>
    <form class="input">
      <input type="text" placeholder="${escapeHtml(placeholder)}" aria-label="Message input" autocomplete="off" />
      <button type="submit" aria-label="Send" disabled>${sendIcon()}</button>
    </form>
    <div class="footer">powered by <a href="https://helia.snowztech.com" target="_blank" rel="noopener">helia</a></div>
  `;
  root.appendChild(panel);

  const messagesEl = panel.querySelector(".messages") as HTMLElement;
  const form = panel.querySelector("form") as HTMLFormElement;
  const input = panel.querySelector("input") as HTMLInputElement;
  const sendBtn = panel.querySelector('button[type="submit"]') as HTMLButtonElement;
  const closeBtn = panel.querySelector(".close") as HTMLButtonElement;
  const titleEl = panel.querySelector(".header-title") as HTMLElement;
  const subtitleEl = panel.querySelector(".header-subtitle") as HTMLElement;

  const state: State = {
    open: false,
    streaming: false,
    messages: [],
    position: "right",
  };

  const greetingEl = appendMessage("assistant", greeting);

  // Fetch the workspace config and apply it.
  void loadRemoteConfig(apiUrl, config.workspace).then((remote) => {
    if (!remote) return;
    applyRemote(remote);
  });

  function applyRemote(remote: RemoteConfig): void {
    hostEl.style.setProperty("--helia-primary", remote.theme.primary);
    if (typeof remote.theme.radius === "number") {
      hostEl.style.setProperty("--helia-radius", `${remote.theme.radius}px`);
    }
    applyThemeMode(remote.theme.mode);
    applyPosition(remote.layout?.position);

    botName = remote.bot.name;
    greeting = remote.bot.greeting;
    placeholder = remote.bot.placeholder ?? placeholder;
    titleEl.textContent = botName;
    subtitleEl.textContent = remote.bot.subtitle ?? "";
    input.placeholder = placeholder;
    panel.setAttribute("aria-label", `${botName} chat`);

    if (state.messages.length === 0) {
      greetingEl.textContent = greeting;
    }
  }

  function applyThemeMode(mode: RemoteConfig["theme"]["mode"]): void {
    const resolved = resolveTheme(mode);
    hostEl.dataset.mode = resolved;
  }

  function applyPosition(
    pos: "bottom-right" | "bottom-left" | undefined,
  ): void {
    const next: "left" | "right" = pos === "bottom-left" ? "left" : "right";
    state.position = next;
    launcher.classList.remove("left", "right");
    launcher.classList.add(next);
    panel.classList.remove("left", "right");
    panel.classList.add(next);
  }

  // --- Wiring
  launcher.addEventListener("click", () => setOpen(true));
  closeBtn.addEventListener("click", () => setOpen(false));

  input.addEventListener("input", () => {
    sendBtn.disabled = state.streaming || input.value.trim().length === 0;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void send();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.open) setOpen(false);
  });

  function setOpen(open: boolean): void {
    state.open = open;
    panel.classList.toggle("open", open);
    launcher.classList.toggle("hidden", open);
    if (open) {
      setTimeout(() => input.focus(), 180);
    }
  }

  function appendMessage(role: ChatMessage["role"], content: string): HTMLElement {
    const el = document.createElement("div");
    el.className = `message ${role}`;
    el.textContent = content;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function appendToolIndicator(toolName: string): HTMLElement {
    const el = document.createElement("div");
    el.className = "message tool";
    el.textContent = `using ${toolName}…`;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function appendTyping(): HTMLElement {
    const el = document.createElement("div");
    el.className = "message assistant";
    el.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function scrollToBottom(): void {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function send(): Promise<void> {
    const text = input.value.trim();
    if (!text || state.streaming) return;

    input.value = "";
    sendBtn.disabled = true;
    state.streaming = true;

    const userMsg: ChatMessage = { role: "user", content: text };
    state.messages.push(userMsg);
    appendMessage("user", text);

    const typingEl = appendTyping();
    let assistantEl: HTMLElement | null = null;
    let assistantText = "";
    let toolEl: HTMLElement | null = null;

    await streamChat(apiUrl, state.messages, {
      onDelta: (delta) => {
        if (!assistantEl) {
          typingEl.remove();
          assistantEl = document.createElement("div");
          assistantEl.className = "message assistant";
          messagesEl.appendChild(assistantEl);
        }
        assistantText += delta;
        assistantEl.textContent = assistantText;
        scrollToBottom();
      },
      onToolStart: (toolName) => {
        if (toolEl) toolEl.remove();
        toolEl = appendToolIndicator(toolName);
      },
      onToolEnd: () => {
        if (toolEl) {
          toolEl.remove();
          toolEl = null;
        }
      },
      onDone: () => {
        if (typingEl.isConnected) typingEl.remove();
        if (toolEl?.isConnected) toolEl.remove();
        if (assistantText) {
          state.messages.push({ role: "assistant", content: assistantText });
        }
        state.streaming = false;
        sendBtn.disabled = input.value.trim().length === 0;
        input.focus();
      },
      onError: (err) => {
        if (typingEl.isConnected) typingEl.remove();
        if (toolEl?.isConnected) toolEl.remove();
        const errEl = document.createElement("div");
        errEl.className = "message assistant";
        errEl.textContent = `Sorry, something went wrong: ${err.message}`;
        messagesEl.appendChild(errEl);
        state.streaming = false;
        sendBtn.disabled = input.value.trim().length === 0;
      },
    });
  }

  return { destroy: () => host.remove() };
}

function resolveTheme(mode: RemoteConfig["theme"]["mode"]): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function chatIcon(): string {
  return /* html */ `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  `;
}

function closeIcon(): string {
  return /* html */ `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  `;
}

function sendIcon(): string {
  return /* html */ `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
