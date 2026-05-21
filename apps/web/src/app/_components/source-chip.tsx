"use client";

import { useState } from "react";
import { api, type Chunk } from "@/lib/api";

/**
 * Single source chip rendered under an assistant message. Clicking expands
 * the chunk content inline so the user can verify what the model actually
 * saw. URLs (for web crawls) link out via an explicit "open ↗" button to
 * keep the chip primary action consistent — always "inspect the chunk".
 */
export function SourceChip({
  index,
  id,
  title,
  url,
  score,
}: {
  index: number;
  id: string;
  title: string;
  url: string | null;
  score: number;
}) {
  const [open, setOpen] = useState(false);
  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (chunk || loading) return;
    setLoading(true);
    try {
      const res = await api.getChunk(id);
      setChunk(res.chunk);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <span>
      <button
        type="button"
        onClick={toggle}
        className="sn-badge"
        title={`${title} · score ${score}`}
        style={{ cursor: "pointer" }}
      >
        [{index}] {title.length > 32 ? title.slice(0, 32) + "…" : title}
      </button>

      {open && (
        <div
          className="mt-2 mb-3 border p-3 text-xs leading-relaxed"
          style={{
            borderColor: "var(--sn-border-subtle)",
            background: "var(--sn-bg-inset)",
          }}
        >
          {loading && <span className="subtle">loading…</span>}
          {error && (
            <span style={{ color: "var(--sn-danger)" }}>{error}</span>
          )}
          {chunk && (
            <>
              <div className="subtle mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider">
                <span>
                  source [{index}] · {chunk.tokens} tokens · score {score}
                </span>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="accent"
                  >
                    open ↗
                  </a>
                )}
              </div>
              <div className="whitespace-pre-wrap">{chunk.content}</div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
