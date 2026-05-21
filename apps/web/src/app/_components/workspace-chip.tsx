"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Tiny indicator in the header showing which workspace the admin is editing.
 * Multi-workspace selection lands later; for now this is read-only context.
 */
export function WorkspaceChip() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    api
      .getWorkspace()
      .then(({ workspace }) => setName(workspace.name))
      .catch(() => {
        // silent — header chrome, not load-blocking
      });
  }, []);

  if (!name) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-success"
        aria-hidden="true"
      />
      <span className="font-mono">{name}</span>
    </div>
  );
}
