"use client";

import { useState } from "react";

/**
 * Visual for a single tool call inside a chat message. Generic over tool
 * name; today `search_knowledge` is the main consumer, more will land as
 * HTTP tools ship.
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
    <div className="my-2 border-l-2 border-border pl-3 text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-baseline gap-2 text-left text-muted-foreground"
      >
        <span className="text-[10px] uppercase tracking-wider">
          {inv.toolName}
        </span>
        {query && (
          <span className="font-mono text-foreground">"{query}"</span>
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
              className="rounded-md border border-border bg-muted/40 p-2"
            >
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>
                  [{r.index}] {r.title} · score {r.score}
                </span>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
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
        <p className="mt-1 italic text-muted-foreground">{inv.result.note}</p>
      )}
    </div>
  );
}
