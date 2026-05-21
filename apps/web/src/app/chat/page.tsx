"use client";

import { useChat } from "@ai-sdk/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Input } from "@snowztech/ui";
import { API_URL } from "@/lib/api";
import {
  ToolInvocation,
  type ToolInvocationLike,
} from "../_components/tool-invocation";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="subtle text-sm">loading…</p>}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const params = useSearchParams();
  const preset = params.get("q");
  const submittedPreset = useRef(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    setMessages,
    append,
  } = useChat({
    api: `${API_URL}/v1/chat`,
  });

  // If we landed here from /chat?q=... auto-send that question once.
  useEffect(() => {
    if (preset && !submittedPreset.current) {
      submittedPreset.current = true;
      void append({ role: "user", content: preset });
    }
  }, [preset, append]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl">chat.</h1>
          <p className="muted text-sm leading-relaxed">
            Ask anything — the agent searches your sources when needed.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="sn-btn sn-btn--ghost sn-btn--sm"
          >
            clear
          </button>
        )}
      </header>

      <div
        className="mt-8 flex-1 overflow-y-auto border-t"
        style={{ borderColor: "var(--sn-border-subtle)" }}
      >
        {messages.length === 0 && !error && (
          <p className="subtle py-8 text-sm">
            no messages yet · try a question about something you uploaded.
          </p>
        )}

        <div className="space-y-7 py-6">
          {messages.map((m) => (
            <MessageBlock key={m.id} role={m.role} parts={m.parts} content={m.content} />
          ))}

          {error && (
            <div className="text-sm" role="alert" style={{ color: "var(--sn-danger)" }}>
              chat error · {error.message ?? "request failed"}
              <div className="muted mt-1 text-xs">
                is the api running on <code>{API_URL}</code>?
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t pt-4"
        style={{ borderColor: "var(--sn-border-subtle)" }}
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="type your question…"
          disabled={busy}
          className="flex-1"
          autoFocus
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="sn-btn sn-btn--accent"
          style={{ minWidth: "6rem" }}
        >
          {busy ? "…" : "send →"}
        </button>
      </form>
    </div>
  );
}

/**
 * Render a single chat message.
 *
 * AI SDK v4 messages have a `parts` array interleaving text and tool calls.
 * We walk them in order so the conversation reads naturally:
 *   tool invocation → tool result → text → tool invocation → text …
 *
 * Falls back to the legacy `content` string if `parts` is absent.
 */
function MessageBlock({
  role,
  parts,
  content,
}: {
  role: "user" | "assistant" | "system" | "data";
  parts?: Array<{
    type: string;
    text?: string;
    toolInvocation?: ToolInvocationLike;
  }>;
  content: string;
}) {
  const isUser = role === "user";
  const label = isUser ? "you" : role === "assistant" ? "helia" : role;

  return (
    <div className="space-y-2">
      <div
        className="text-[11px] uppercase tracking-[0.18em]"
        style={{ color: isUser ? "var(--sn-accent)" : "var(--sn-fg-subtle)" }}
      >
        {label}
      </div>

      {parts && parts.length > 0 ? (
        parts.map((p, i) => {
          if (p.type === "text" && p.text) {
            return (
              <div
                key={i}
                className="whitespace-pre-wrap text-sm leading-relaxed"
              >
                {p.text}
              </div>
            );
          }
          if (p.type === "tool-invocation" && p.toolInvocation) {
            return <ToolInvocation key={i} inv={p.toolInvocation} />;
          }
          return null;
        })
      ) : (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
      )}
    </div>
  );
}
