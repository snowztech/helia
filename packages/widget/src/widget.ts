import { baseStyles } from "./styles";
import { streamChat } from "./stream";
import {
  loadRemoteConfig,
  readCachedConfig,
  writeCachedConfig,
  type RemoteConfig,
} from "./config";
import { getIdentity } from "./identity";
import {
  getOrCreateConversationId,
  resetConversationId,
} from "./conversation";
import { renderMarkdown } from "./markdown";
import { strings, type Locale } from "./i18n";
import type { ChatMessage, WidgetConfig, WidgetHandle } from "./types";

const HOST_ID = "helia-widget";

/**
 * Default API URL. Derived from the script's own origin so the same bundle
 * works in hosted (app.gethelia.dev → api.gethelia.dev) and self-host
 * (helia.customer.com → api.helia.customer.com). Operators using a
 * non-conventional layout pass `data-api-url` on the script tag.
 */
function defaultApiUrl(): string {
  if (typeof window === "undefined") return "http://localhost:4000";

  const script = Array.from(document.getElementsByTagName("script"))
    .reverse()
    .find((s) => s.src && s.src.includes("/w.js"));
  if (!script) return "http://localhost:4000";

  try {
    const url = new URL(script.src);
    // localhost dev: assume API on :4000 of the same host.
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return `${url.protocol}//${url.hostname}:4000`;
    }
    // Swap leading `app.` for `api.` (Helia's convention).
    const host = url.hostname.startsWith("app.")
      ? "api." + url.hostname.slice(4)
      : "api." + url.hostname;
    return `${url.protocol}//${host}`;
  } catch {
    return "http://localhost:4000";
  }
}

interface State {
  open: boolean;
  streaming: boolean;
  messages: ChatMessage[];
}

export function mount(config: WidgetConfig): WidgetHandle {
  if (document.getElementById(HOST_ID)) {
    const existing = document.getElementById(HOST_ID);
    return { destroy: () => existing?.remove() };
  }

  const apiUrl = config.apiUrl ?? defaultApiUrl();
  const embedded = config.mode === "embedded";

  // In embedded mode, resolve the target element.
  let targetEl: Element | null = null;
  if (embedded) {
    if (!config.target) {
      console.warn("[helia] embedded mode requires a `target` selector. Falling back to floating.");
      targetEl = null;
    } else {
      targetEl = document.querySelector(config.target);
      if (!targetEl) {
        console.warn(`[helia] embedded mode: target "${config.target}" not found. Falling back to floating.`);
      }
    }
  }

  let botName = config.botName ?? "Assistant";
  let greeting = config.greeting ?? "Hi, how can I help?";
  let placeholder = "Ask a question...";
  let botAvatar: string | null = null;
  let locale: Locale | undefined = undefined;
  let t = strings(locale);

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.dataset.workspace = config.workspace;
  if (targetEl) {
    targetEl.appendChild(host);
  } else {
    document.body.appendChild(host);
  }

  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = baseStyles;
  root.appendChild(style);

  const hostEl = root.host as HTMLElement;

  // --- Launcher (floating mode only)
  let launcher: HTMLButtonElement | null = null;
  if (!embedded) {
    launcher = document.createElement("button");
    launcher.className = "launcher right";
    launcher.type = "button";
    launcher.setAttribute("aria-label", t.openChat);
    launcher.innerHTML = avatarMarkup(botAvatar);
    root.appendChild(launcher);
  }

  // --- Panel
  const panel = document.createElement("div");
  panel.className = embedded ? "panel embedded" : "panel right";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", `${botName} chat`);
  panel.innerHTML = `
    <div class="header">
      <div class="avatar" aria-hidden="true">${avatarMarkup(botAvatar)}</div>
      <div class="header-text">
        <div class="header-title">${escapeHtml(botName)}</div>
        <div class="header-subtitle"></div>
      </div>
      <button class="reset" type="button" aria-label="${escapeHtml(t.newChat)}" title="${escapeHtml(t.newChat)}">${resetIcon()}</button>
      <button class="close" type="button" aria-label="${escapeHtml(t.closeChat)}">${closeIcon()}</button>
    </div>
    <div class="messages" role="log" aria-live="polite"></div>
    <form class="input">
      <input type="text" placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(t.messageInput)}" autocomplete="off" />
      <button type="submit" aria-label="${escapeHtml(t.send)}" disabled>${sendIcon()}</button>
    </form>
    <div class="footer">
      <a href="https://gethelia.dev/?utm_source=widget&utm_medium=embed" target="_blank" rel="noopener" class="powered">
        <span>powered by</span>
        <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M 4 22 A 12 12 0 0 1 28 22" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" opacity="1" />
          <path d="M 9 22 A 7 7 0 0 1 23 22" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" opacity="0.55" />
          <path d="M 13.5 22 A 2.5 2.5 0 0 1 18.5 22" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" opacity="0.28" />
        </svg>
        <span class="wordmark">helia</span>
      </a>
    </div>
  `;
  root.appendChild(panel);

  const messagesEl = panel.querySelector(".messages") as HTMLElement;
  const form = panel.querySelector("form") as HTMLFormElement;
  const input = panel.querySelector("input") as HTMLInputElement;
  const sendBtn = panel.querySelector('button[type="submit"]') as HTMLButtonElement;
  const closeBtn = panel.querySelector(".close") as HTMLButtonElement;
  const resetBtn = panel.querySelector(".reset") as HTMLButtonElement;
  const titleEl = panel.querySelector(".header-title") as HTMLElement;
  const subtitleEl = panel.querySelector(".header-subtitle") as HTMLElement;

  const suggestionsEl = document.createElement("ul");
  suggestionsEl.className = "suggestions hidden";
  messagesEl.appendChild(suggestionsEl);

  const state: State = {
    open: embedded,
    streaming: false,
    messages: [],
  };

  // Hold the latest suggestion list so we can re-render when the
  // conversation resets to empty.
  let currentSuggestions: string[] = [];

  let greetingEl = appendMessage("assistant", greeting);

  // First paint: if we have a cached config from a previous load, apply it
  // immediately so the right brand/wording shows up on the first frame
  // instead of flashing defaults while the network call resolves.
  const cached = readCachedConfig(config.workspace);
  if (cached) applyRemote(cached);

  void loadRemoteConfig(apiUrl, config.workspace).then((remote) => {
    if (!remote) return;
    applyRemote(remote);
    writeCachedConfig(config.workspace, remote);
  });

  // DX hint: most common embed mistake is forgetting to give the target
  // container a height. Check after a paint so flex parents have settled.
  if (embedded && targetEl instanceof HTMLElement) {
    const el = targetEl;
    requestAnimationFrame(() => {
      if (el.isConnected && el.offsetHeight === 0) {
        console.warn(
          `[helia] embed target "${config.target}" has 0 height. Give it an explicit height (e.g. style="height: 600px") or place it in a flex/grid cell with a defined size.`,
        );
      }
    });
  }

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
    botAvatar = remote.bot.avatar ?? null;
    locale = remote.workspace.locale;
    t = strings(locale);
    if (launcher) {
      launcher.setAttribute("aria-label", t.openChat);
      launcher.innerHTML = avatarMarkup(botAvatar);
    }
    const closeBtn = panel.querySelector(".close");
    if (closeBtn) closeBtn.setAttribute("aria-label", t.closeChat);
    resetBtn.setAttribute("aria-label", t.newChat);
    resetBtn.setAttribute("title", t.newChat);
    input.setAttribute("aria-label", t.messageInput);
    sendBtn.setAttribute("aria-label", t.send);
    titleEl.textContent = botName;
    subtitleEl.textContent = remote.bot.subtitle ?? "";
    input.placeholder = placeholder;
    panel.setAttribute("aria-label", `${botName} chat`);

    // Refresh the icons now that we know what the customer chose.
    const avatarSlot = panel.querySelector(".avatar");
    if (avatarSlot) {
      avatarSlot.innerHTML = avatarMarkup(botAvatar);
    }

    currentSuggestions = remote.bot.suggestions ?? [];
    if (state.messages.length === 0) {
      greetingEl.textContent = greeting;
      renderSuggestions(currentSuggestions);
    }
  }

  function renderSuggestions(items: string[]): void {
    suggestionsEl.innerHTML = "";
    if (items.length === 0 || state.messages.length > 0) {
      suggestionsEl.classList.add("hidden");
      return;
    }
    for (const q of items) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = q;
      btn.addEventListener("click", () => {
        input.value = q;
        void send();
      });
      li.appendChild(btn);
      suggestionsEl.appendChild(li);
    }
    suggestionsEl.classList.remove("hidden");
  }

  function resetConversation(): void {
    if (state.streaming) return;
    state.messages = [];
    resetConversationId(config.workspace);
    // Wipe everything from the messages area and re-seed with the greeting
    // and any configured suggestions, so the user sees the same first
    // frame they got when they originally opened the chat.
    messagesEl.innerHTML = "";
    messagesEl.appendChild(suggestionsEl);
    greetingEl = appendMessage("assistant", greeting);
    renderSuggestions(currentSuggestions);
    input.value = "";
    sendBtn.disabled = true;
    input.focus();
  }

  function applyThemeMode(mode: RemoteConfig["theme"]["mode"]): void {
    const resolved = resolveTheme(mode);
    hostEl.dataset.mode = resolved;
  }

  function applyPosition(
    pos: "bottom-right" | "bottom-left" | undefined,
  ): void {
    if (embedded) return;
    const next: "left" | "right" = pos === "bottom-left" ? "left" : "right";
    if (launcher) {
      launcher.classList.remove("left", "right");
      launcher.classList.add(next);
    }
    panel.classList.remove("left", "right");
    panel.classList.add(next);
  }

  // --- Wiring
  if (launcher) {
    launcher.addEventListener("click", () => setOpen(true));
  }
  if (!embedded) {
    closeBtn.addEventListener("click", () => setOpen(false));
  }
  resetBtn.addEventListener("click", () => resetConversation());

  input.addEventListener("input", () => {
    sendBtn.disabled = state.streaming || input.value.trim().length === 0;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void send();
  });

  if (!embedded) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.open) setOpen(false);
    });
  }

  function setOpen(open: boolean): void {
    if (embedded) return;
    state.open = open;
    panel.classList.toggle("open", open);
    if (launcher) launcher.classList.toggle("hidden", open);
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

  function appendToolPill(toolName: string): HTMLElement {
    const el = document.createElement("div");
    el.className = "tool-pill";
    el.innerHTML = `<span class="dot"></span><span class="label">${escapeHtml(toolLabel(toolName, t))}</span>`;
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

  function appendCitations(
    sources: Array<{ title: string; url: string | null }>,
  ): void {
    if (sources.length === 0) return;
    const wrap = document.createElement("div");
    wrap.className = "citations";

    const head = document.createElement("div");
    head.className = "citations-header";
    head.textContent = `${sources.length} ${sources.length === 1 ? "source" : "sources"}`;
    wrap.appendChild(head);

    const ul = document.createElement("ul");
    for (const s of sources.slice(0, 4)) {
      const li = document.createElement("li");
      if (s.url) {
        const a = document.createElement("a");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = s.title;
        li.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.className = "cite";
        span.textContent = s.title;
        li.appendChild(span);
      }
      ul.appendChild(li);
    }
    wrap.appendChild(ul);
    messagesEl.appendChild(wrap);
    scrollToBottom();
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
    suggestionsEl.classList.add("hidden");
    appendMessage("user", text);

    const typingEl = appendTyping();
    let assistantEl: HTMLElement | null = null;
    let assistantText = "";
    let activeToolPill: HTMLElement | null = null;
    let sources: Array<{ title: string; url: string | null }> = [];

    const conversationId = getOrCreateConversationId(config.workspace);
    await streamChat(
      apiUrl,
      config.workspace,
      conversationId,
      state.messages,
      getIdentity(),
      {
      onDelta: (delta) => {
        if (!assistantEl) {
          if (typingEl.isConnected) typingEl.remove();
          assistantEl = document.createElement("div");
          assistantEl.className = "message assistant";
          messagesEl.appendChild(assistantEl);
        }
        assistantText += delta;
        assistantEl.innerHTML = renderMarkdown(assistantText);
        scrollToBottom();
      },
      onToolStart: (toolName) => {
        // The "thinking" typing dots are no longer useful — replace with a
        // concrete agent step.
        if (typingEl.isConnected) typingEl.remove();
        activeToolPill = appendToolPill(toolName);
      },
      onToolResult: (toolName, result) => {
        if (activeToolPill) {
          activeToolPill.classList.add("done");
          const dot = activeToolPill.querySelector(".dot");
          if (dot) dot.remove();
          activeToolPill = null;
        }
        // Pull source titles from search_knowledge for citation rendering.
        if (toolName === "search_knowledge") {
          const extracted = extractSources(result);
          for (const s of extracted) sources.push(s);
        }
      },
      onDone: () => {
        if (typingEl.isConnected) typingEl.remove();
        if (assistantText) {
          state.messages.push({ role: "assistant", content: assistantText });
          appendCitations(dedupeSources(sources));
        }
        state.streaming = false;
        sendBtn.disabled = input.value.trim().length === 0;
        input.focus();
      },
      onError: (err) => {
        if (typingEl.isConnected) typingEl.remove();
        if (activeToolPill?.isConnected) activeToolPill.remove();
        const errEl = document.createElement("div");
        errEl.className = "message assistant";
        errEl.textContent = t.somethingWentWrong(err.message);
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

// Icon SVGs copied from @hugeicons/core-free-icons so the deployed widget
// (pure TS, no React) renders the same marks as the admin preview.
// Source: SparklesIcon, Cancel01Icon, ArrowUp02Icon. Strokes use currentColor.

function toolLabel(name: string, t: ReturnType<typeof strings>): string {
  if (name === "search_knowledge") return t.searchingKnowledge;
  return t.callingTool(name);
}

function extractSources(
  result: unknown,
): Array<{ title: string; url: string | null }> {
  if (!result || typeof result !== "object") return [];
  const r = result as { results?: unknown };
  if (!Array.isArray(r.results)) return [];
  const out: Array<{ title: string; url: string | null }> = [];
  for (const row of r.results) {
    if (!row || typeof row !== "object") continue;
    const obj = row as { title?: unknown; url?: unknown };
    const title = typeof obj.title === "string" ? obj.title : null;
    if (!title) continue;
    const url = typeof obj.url === "string" ? obj.url : null;
    out.push({ title, url });
  }
  return out;
}

function dedupeSources(
  list: Array<{ title: string; url: string | null }>,
): Array<{ title: string; url: string | null }> {
  const seen = new Set<string>();
  const out: Array<{ title: string; url: string | null }> = [];
  for (const s of list) {
    const key = `${s.title}|${s.url ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/**
 * Header and launcher mark. URL → <img>, single character → text mark,
 * otherwise the Helia logo (three nested arcs). Strokes inherit
 * currentColor so the brand primary tints them.
 */
function avatarMarkup(avatar: string | null | undefined): string {
  if (avatar) {
    if (isHttpUrl(avatar)) {
      return /* html */ `<img src="${escapeAttr(avatar)}" alt="" />`;
    }
    const ch = [...avatar.trim()][0] ?? "";
    return /* html */ `<span class="avatar-text">${escapeHtml(ch)}</span>`;
  }
  return /* html */ `
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor"
         stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M 4 22 A 12 12 0 0 1 28 22" opacity="1" />
      <path d="M 9 22 A 7 7 0 0 1 23 22" opacity="0.65" />
      <path d="M 13.5 22 A 2.5 2.5 0 0 1 18.5 22" opacity="0.35" />
    </svg>
  `;
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function resetIcon(): string {
  return /* html */ `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  `;
}

function closeIcon(): string {
  return /* html */ `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M19 5L5 19M5 5L19 19" />
    </svg>
  `;
}

function sendIcon(): string {
  return /* html */ `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M12 4V20" />
      <path d="M6 10L11.2929 4.70711C11.6262 4.37377 11.7929 4.20711 12 4.20711C12.2071 4.20711 12.3738 4.37377 12.7071 4.70711L18 10" />
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
