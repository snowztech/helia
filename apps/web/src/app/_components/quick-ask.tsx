"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@snowztech/ui";

/**
 * Lightweight input on the home page — type a question, navigate to /chat
 * with it preloaded. Visually muted because the primary CTA on the home
 * page is "add source"; this is the secondary path for users who already
 * have sources.
 */
export function QuickAsk() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (v.length === 0) return;
    router.push(`/chat?q=${encodeURIComponent(v)}`);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ask a question…"
        className="flex-1"
        style={{ background: "var(--sn-bg-inset)" }}
      />
      <button
        type="submit"
        disabled={q.trim().length === 0}
        className="sn-btn sn-btn--secondary"
        style={{ minWidth: "5rem" }}
      >
        ask →
      </button>
    </form>
  );
}
