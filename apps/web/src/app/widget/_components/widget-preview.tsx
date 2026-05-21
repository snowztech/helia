"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface PreviewConfig {
  primary: string;
  position: "bottom-right" | "bottom-left";
  theme: "light" | "dark" | "auto";
  radius: number;
  botName: string;
  botSubtitle: string;
  botGreeting: string;
  botPlaceholder: string;
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
  const [open, setOpen] = useState(false);
  const themeMode = useResolvedTheme(config.theme);

  return (
    <FakeBrowser theme={themeMode}>
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

function FakeBrowser({
  theme,
  children,
}: {
  theme: "light" | "dark";
  children: React.ReactNode;
}) {
  const dark = theme === "dark";
  return (
    <div
      className={cn(
        "relative h-[520px] w-full overflow-hidden rounded-lg border border-border",
        dark ? "bg-[#0e0e0e] text-zinc-400" : "bg-zinc-50 text-zinc-500",
      )}
    >
      <div className="absolute left-0 right-0 top-0 h-6 border-b border-border/40 bg-black/20 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-zinc-600" />
          <div className="h-2 w-2 rounded-full bg-zinc-600" />
          <div className="h-2 w-2 rounded-full bg-zinc-600" />
          <div className="ml-3 text-[10px] uppercase tracking-wider opacity-60">
            your website
          </div>
        </div>
      </div>
      <div className="px-6 pt-10">
        <div
          className={cn(
            "h-3 w-1/3 rounded",
            dark ? "bg-zinc-800" : "bg-zinc-200",
          )}
        />
        <div
          className={cn(
            "mt-3 h-3 w-2/3 rounded",
            dark ? "bg-zinc-800" : "bg-zinc-200",
          )}
        />
        <div
          className={cn(
            "mt-3 h-3 w-1/2 rounded",
            dark ? "bg-zinc-800" : "bg-zinc-200",
          )}
        />
      </div>
      {children}
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
    config.position === "bottom-right" ? "bottom-5 right-5" : "bottom-5 left-5";
  return (
    <button
      type="button"
      data-shadcn=""
      onClick={onClick}
      aria-label="Open chat"
      className={cn(
        "absolute h-12 w-12 rounded-full text-white shadow-lg transition-all duration-150",
        posClass,
        hidden ? "scale-90 opacity-0 pointer-events-none" : "scale-100 opacity-100 hover:-translate-y-0.5",
      )}
      style={{ background: config.primary }}
    >
      <MessageCircle className="mx-auto h-5 w-5" />
    </button>
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
    config.position === "bottom-right" ? "bottom-5 right-5" : "bottom-5 left-5";
  const dark = themeMode === "dark";

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: `${API_URL}/v1/chat`,
  });

  const busy = status === "submitted" || status === "streaming";
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const allMessages = useMemo(() => {
    return [
      {
        id: "greeting",
        role: "assistant" as const,
        content: config.botGreeting,
      },
      ...messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];
  }, [messages, config.botGreeting]);

  return (
    <div
      className={cn(
        "absolute flex w-[340px] flex-col overflow-hidden shadow-2xl",
        posClass,
        dark ? "bg-[#161616] text-zinc-100" : "bg-white text-zinc-900",
      )}
      style={{ borderRadius: config.radius, height: 440 }}
    >
      <header
        className="flex items-start justify-between px-4 py-3 text-white"
        style={{ background: config.primary }}
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{config.botName}</div>
          {config.botSubtitle && (
            <div className="truncate text-xs opacity-90">
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
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
        {allMessages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap px-3 py-2 text-[13px] leading-snug",
              m.role === "user"
                ? "ml-auto rounded-2xl rounded-br-sm text-white"
                : dark
                  ? "mr-auto rounded-2xl rounded-bl-sm bg-zinc-800"
                  : "mr-auto rounded-2xl rounded-bl-sm bg-zinc-100",
            )}
            style={
              m.role === "user" ? { background: config.primary } : undefined
            }
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-auto inline-flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </div>
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
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <div
        className={cn(
          "py-1.5 text-center text-[10px]",
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
