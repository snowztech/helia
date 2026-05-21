"use client";

import { useState } from "react";

/**
 * Visual for a single tool call in a chat message. We render different states:
 *  - partial-call / call → spinner-like line with the tool name and query
 *  - result              → "found N sources" header, expandable details
 *
 * Today only one tool is wired (`search_knowledge`) but the component is
 * generic over tool name so we can add more without UI churn.
 */
export type ToolInvocationLike = {
  toolCallId: string;
  toolName: string;
  state: "partial-call" | "call" | "result";
  args?: { query?: string; [k: string]: unknown };
  result?: {
    query?: string;
    results?: Array<{
      index: number;
      chunkId: string;
      title: string;
      url: string | null;
      score: number;
      content: string;
    }>;
    note?: string;
  };
};

export function ToolInvocation({ inv }: { inv: ToolInvocationLike }) {
  const [open, setOpen] = useState(false);

  const query = inv.args?.query ?? inv.result?.query ?? "";
  const results = inv.result?.results ?? [];
  const isDone = inv.state === "result";
  const found = results.length;

  return (
    <div
      className="my-2 border-l-2 pl-3 text-xs"
      style={{ borderColor: "var(--sn-border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-baseline gap-2 text-left"
        style={{ color: "var(--sn-fg-muted)" }}
      >
        <span className="uppercase tracking-wider text-[10px]">
          {inv.toolName}
        </span>
        {query && (
          <span className="font-mono" style={{ color: "var(--sn-fg)" }}>
            "{query}"
          </span>
        )}
        {!isDone && <span>· searching…</span>}
        {isDone && (
          <span>
            · {found === 0 ? "no results" : `${found} source${found > 1 ? "s" : ""}`}
            {found > 0 && (
              <span className="ml-2 underline">{open ? "hide" : "show"}</span>
            )}
          </span>
        )}
      </button>

      {isDone && open && results.length > 0 && (
        <ol className="mt-2 space-y-2">
          {results.map((r) => (
            <li
              key={r.chunkId}
              className="border p-2"
              style={{
                borderColor: "var(--sn-border-subtle)",
                background: "var(--sn-bg-inset)",
              }}
            >
              <div
                className="subtle mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider"
              >
                <span>
                  [{r.index}] {r.title} · score {r.score}
                </span>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="accent"
                  >
                    open ↗
                  </a>
                )}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {r.content}
              </div>
            </li>
          ))}
        </ol>
      )}

      {isDone && results.length === 0 && inv.result?.note && (
        <p className="subtle mt-1 italic">{inv.result.note}</p>
      )}
    </div>
  );
}
