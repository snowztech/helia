"use client";

import { useState } from "react";

export function CopyCode({
  code,
  label = "copy",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      {copied ? "copied" : label}
    </button>
  );
}
