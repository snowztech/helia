"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { api, type Workspace } from "@/lib/api";

export function EmbedAllowlist({
  workspace,
  onWorkspace,
}: {
  workspace: Workspace;
  onWorkspace: (w: Workspace) => void;
}) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (next: string[]) => {
    setSaving(true);
    try {
      const { workspace: updated } = await api.patchWorkspace({
        allowedOrigins: next,
      });
      onWorkspace(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "save failed");
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    const trimmed = input.trim().replace(/\/+$/, "");
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.error("must be a full URL like https://example.com");
      return;
    }
    if (workspace.allowedOrigins.includes(trimmed)) {
      toast.error("already in the list");
      return;
    }
    await save([...workspace.allowedOrigins, trimmed]);
    setInput("");
  };

  const remove = async (origin: string) => {
    await save(workspace.allowedOrigins.filter((o) => o !== origin));
  };

  const empty = workspace.allowedOrigins.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
          placeholder="https://example.com"
          disabled={saving}
        />
        <Button onClick={add} disabled={saving || !input.trim()}>
          <HugeiconsIcon icon={Add01Icon} size={14} />
          add
        </Button>
      </div>

      {empty ? (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Badge variant="warning" className="whitespace-nowrap">
            no origins set
          </Badge>
          <p className="text-[11px] text-muted-foreground">
            Widget loads from any site. Lock it to your domain before going
            live.
          </p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {workspace.allowedOrigins.map((o) => (
            <li key={o}>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs">
                <code>{o}</code>
                <button
                  type="button"
                  onClick={() => void remove(o)}
                  disabled={saving}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${o}`}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        Origins must match exactly (protocol + host + port). The widget is
        rejected with 403 from any other origin.
      </p>
    </div>
  );
}
