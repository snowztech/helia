"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { renderMarkdown } from "@/lib/markdown";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface PreviewConfig {
  workspaceId: string;
  primary: string;
  position: "bottom-right" | "bottom-left";
  theme: "light" | "dark" | "auto";
  radius: number;
  botName: string;
  botSubtitle: string;
  botGreeting: string;
  botPlaceholder: string;
  suggestions: string[];
  botAvatar: string | null;
}

/**
 * Faithful in-browser preview of the widget. Same visual structure as the
 * production embed in `packages/widget`, rendered as a React component so
 * the admin can drive it from local state without rebuilding the bundle.
 *
 * Uses the real `/v1/chat` endpoint, so clicking the launcher and chatting
 * actually exercises the agent end-to-end.
 */
export function WidgetPreview({ config }: { config: PreviewConfig }) {
  // Default open in the admin preview — you're configuring the panel, not
  // the launcher, so showing the panel first is the right context.
  const [open, setOpen] = useState(true);
  const themeMode = useResolvedTheme(config.theme);

  return (
    <FakeBrowser>
      {open ? (
        <Panel
          config={config}
          themeMode={themeMode}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <Launcher
        config={config}
        hidden={open}
        onClick={() => setOpen(true)}
      />
    </FakeBrowser>
  );
}

function useResolvedTheme(theme: PreviewConfig["theme"]): "light" | "dark" {
  const [auto, setAuto] = useState<"light" | "dark">("dark");
  useEffect(() => {
    if (theme !== "auto") return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setAuto(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  return theme === "auto" ? auto : theme;
}

function FakeBrowser({ children }: { children: React.ReactNode }) {
  // The frame represents the customer's website chrome — neutral, following
  // the admin's theme tokens. The widget panel inside is what reacts to the
  // widget's own light/dark/auto setting.
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex h-6 items-center gap-1.5 border-b border-border bg-muted/60 px-3">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
        <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
        <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      </div>
      <div className="relative flex h-[580px] items-end justify-center p-4">
        {children}
      </div>
    </div>
  );
}

function Launcher({
  config,
  hidden,
  onClick,
}: {
  config: PreviewConfig;
  hidden: boolean;
  onClick: () => void;
}) {
  const posClass =
    config.position === "bottom-right" ? "right-4" : "left-4";
  return (
    <button
      type="button"
      data-shadcn=""
      onClick={onClick}
      aria-label="Open chat"
      className={cn(
        "absolute bottom-4 h-12 w-12 rounded-full text-white shadow-lg transition-all duration-150",
        posClass,
        hidden
          ? "scale-90 opacity-0 pointer-events-none"
          : "scale-100 opacity-100 hover:-translate-y-0.5",
      )}
      style={{ background: config.primary }}
    >
      <AvatarMark avatar={config.botAvatar} size={22} />
    </button>
  );
}

/**
 * Header / launcher mark, mirroring the bundle's logic so the admin sees
 * what end-users will see.
 */
function AvatarMark({
  avatar,
  size,
}: {
  avatar: string | null;
  size: number;
}) {
  if (avatar) {
    if (/^https?:\/\//i.test(avatar)) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={avatar}
          alt=""
          className="mx-auto h-full w-full rounded-full object-cover"
        />
      );
    }
    return (
      <span className="block text-center font-semibold" style={{ fontSize: size }}>
        {[...avatar.trim()][0] ?? ""}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto"
      aria-hidden="true"
    >
      <path d="M 4 22 A 12 12 0 0 1 28 22" opacity={1} />
      <path d="M 9 22 A 7 7 0 0 1 23 22" opacity={0.65} />
      <path d="M 13.5 22 A 2.5 2.5 0 0 1 18.5 22" opacity={0.35} />
    </svg>
  );
}

function Panel({
  config,
  themeMode,
  onClose,
}: {
  config: PreviewConfig;
  themeMode: "light" | "dark";
  onClose: () => void;
}) {
  const posClass =
    config.position === "bottom-right" ? "right-4" : "left-4";
  const dark = themeMode === "dark";

  // One conversation per mount of the preview. We don't persist it: the
  // admin is iterating on the widget, not having a real chat.
  const previewConversationId = useMemo(() => crypto.randomUUID(), []);

  const { messages, input, handleInputChange, handleSubmit, status, append } =
    useChat({
      api: `${API_URL}/v1/chat?ws=${encodeURIComponent(config.workspaceId)}&conv=${previewConversationId}`,
    });

  const waiting = status === "submitted";
  const busy = status === "submitted" || status === "streaming";
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `block: "nearest"` keeps the scroll inside the preview's own
    // overflow-container instead of jumping the whole settings page.
    messagesEnd.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, status]);

  return (
    <div
      className={cn(
        "absolute bottom-4 flex w-[360px] flex-col overflow-hidden shadow-2xl",
        posClass,
        dark ? "bg-[#161616] text-zinc-100" : "bg-white text-zinc-900",
      )}
      style={{ borderRadius: config.radius, height: 540 }}
    >
      <header
        className="flex items-start gap-3 px-4 py-3.5 text-white"
        style={{ background: config.primary }}
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
          <AvatarMark avatar={config.botAvatar} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">
            {config.botName}
          </div>
          {config.botSubtitle && (
            <div className="mt-0.5 truncate text-xs opacity-90">
              {config.botSubtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          data-shadcn=""
          onClick={onClose}
          aria-label="Close"
          className="rounded p-1 opacity-80 hover:bg-white/10 hover:opacity-100"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
        <AssistantBubble dark={dark}>{config.botGreeting}</AssistantBubble>

        {messages.map((m) => (
          <MessageRender
            key={m.id}
            message={m}
            primary={config.primary}
            dark={dark}
          />
        ))}

        {waiting && (
          <div
            className={cn(
              "mr-auto inline-flex items-center gap-1 rounded-2xl rounded-bl-sm px-3 py-2",
              dark ? "bg-zinc-800" : "bg-zinc-100",
            )}
          >
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </div>
        )}

        {messages.length === 0 && config.suggestions.length > 0 && !busy && (
          <ul className="space-y-1.5 pt-1">
            {config.suggestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  data-shadcn=""
                  onClick={() => void append({ role: "user", content: q })}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2 text-left text-[13px] leading-snug transition-colors",
                    dark
                      ? "border-zinc-700 hover:bg-zinc-800"
                      : "border-zinc-200 hover:bg-zinc-50",
                  )}
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div ref={messagesEnd} />
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 border-t px-3 py-2.5",
          dark ? "border-zinc-800" : "border-zinc-200",
        )}
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder={config.botPlaceholder}
          disabled={busy}
          className={cn(
            "flex-1 rounded-full border bg-transparent px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-offset-1",
            dark
              ? "border-zinc-700 focus:ring-zinc-600 focus:ring-offset-zinc-900"
              : "border-zinc-200 focus:ring-zinc-300 focus:ring-offset-white",
          )}
        />
        <button
          type="submit"
          data-shadcn=""
          disabled={busy || input.trim().length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-50"
          style={{ background: config.primary }}
          aria-label="Send"
        >
          <HugeiconsIcon icon={ArrowUp02Icon} size={14} />
        </button>
      </form>

      <div
        className={cn(
          "flex items-center justify-center py-2 font-mono text-[11px] leading-none tracking-wide",
          dark ? "text-zinc-500" : "text-zinc-400",
        )}
      >
        powered by helia
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-50"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function AssistantBubble({
  dark,
  children,
}: {
  dark: boolean;
  children: string;
}) {
  return (
    <div
      className={cn(
        "preview-md mr-auto max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-[13px] leading-snug",
        dark ? "bg-zinc-800" : "bg-zinc-100",
      )}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(children) }}
    />
  );
}

type ChatPart = {
  type: string;
  text?: string;
  toolInvocation?: {
    toolName: string;
    state: string;
    result?: unknown;
  };
};

type ChatRenderMessage = {
  id: string;
  role: string;
  content: string;
  parts?: ChatPart[];
};

function MessageRender({
  message,
  primary,
  dark,
}: {
  message: ChatRenderMessage;
  primary: string;
  dark: boolean;
}) {
  if (message.role === "user") {
    return (
      <div
        className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm px-3 py-2 text-[13px] leading-snug text-white"
        style={{ background: primary }}
      >
        {message.content}
      </div>
    );
  }

  // Assistant message — walk parts to interleave tool pills + text bubbles.
  const parts: ChatPart[] = message.parts ?? [
    { type: "text", text: message.content },
  ];

  const sources = collectSources(parts);

  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "text" && p.text) {
          return (
            <AssistantBubble key={i} dark={dark}>
              {p.text}
            </AssistantBubble>
          );
        }
        if (p.type === "tool-invocation" && p.toolInvocation) {
          return (
            <ToolPill
              key={i}
              name={p.toolInvocation.toolName}
              done={p.toolInvocation.state === "result"}
              primary={primary}
              dark={dark}
            />
          );
        }
        return null;
      })}
      {sources.length > 0 && (
        <Citations sources={sources} dark={dark} />
      )}
    </>
  );
}

function ToolPill({
  name,
  done,
  primary,
  dark,
}: {
  name: string;
  done: boolean;
  primary: string;
  dark: boolean;
}) {
  return (
    <div
      className={cn(
        "mr-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
        done && "opacity-70",
        dark ? "bg-zinc-800/60" : "bg-zinc-50",
      )}
      style={{
        borderColor: `color-mix(in srgb, ${primary} 25%, transparent)`,
      }}
    >
      {!done && (
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: primary }}
        />
      )}
      <span>{toolLabel(name)}</span>
    </div>
  );
}

function Citations({
  sources,
  dark,
}: {
  sources: Array<{ title: string; url: string | null }>;
  dark: boolean;
}) {
  return (
    <div className="mr-auto flex max-w-full flex-col gap-1.5">
      <div className="text-[10px] uppercase tracking-wider opacity-60">
        {sources.length} {sources.length === 1 ? "source" : "sources"}
      </div>
      <ul className="flex flex-col gap-1">
        {sources.slice(0, 4).map((s, i) => {
          const inner = (
            <span className="block max-w-[280px] truncate">{s.title}</span>
          );
          return (
            <li key={i}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-block rounded-lg border px-2 py-1 text-[12px] transition-colors",
                    dark
                      ? "border-zinc-700 hover:border-zinc-500"
                      : "border-zinc-200 hover:border-zinc-400",
                  )}
                >
                  {inner}
                </a>
              ) : (
                <span
                  className={cn(
                    "inline-block rounded-lg border px-2 py-1 text-[12px]",
                    dark ? "border-zinc-700" : "border-zinc-200",
                  )}
                >
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function toolLabel(name: string): string {
  if (name === "search_knowledge") return "Searching your knowledge…";
  return `Calling ${name}…`;
}

function collectSources(
  parts: ChatPart[],
): Array<{ title: string; url: string | null }> {
  const out: Array<{ title: string; url: string | null }> = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (
      p.type !== "tool-invocation" ||
      !p.toolInvocation ||
      p.toolInvocation.state !== "result"
    )
      continue;
    if (p.toolInvocation.toolName !== "search_knowledge") continue;
    const result = p.toolInvocation.result;
    if (!result || typeof result !== "object") continue;
    const r = result as { results?: unknown };
    if (!Array.isArray(r.results)) continue;
    for (const row of r.results) {
      if (!row || typeof row !== "object") continue;
      const obj = row as { title?: unknown; url?: unknown };
      const title = typeof obj.title === "string" ? obj.title : null;
      if (!title) continue;
      const url = typeof obj.url === "string" ? obj.url : null;
      const key = `${title}|${url ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ title, url });
    }
  }
  return out;
}
