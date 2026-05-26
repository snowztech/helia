"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HEADER_KEEP, type ToolInput, type ToolParam } from "@/lib/api";

export type ToolDraft = ToolInput;

const TYPES: ToolParam["type"][] = ["string", "number", "boolean"];
const NAME_RE = /^[a-z][a-z0-9_]*$/;

export function ToolDialog({
  open,
  onOpenChange,
  initial,
  isEdit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ToolDraft;
  isEdit: boolean;
  onSave: (draft: ToolDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ToolDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setError(null);
    }
  }, [open, initial]);

  const validate = (): string | null => {
    if (!NAME_RE.test(draft.name))
      return "name must be snake_case, start with a letter";
    if (draft.description.trim().length === 0) return "description required";
    try {
      new URL(draft.url);
    } catch {
      return "url must be a valid http(s) URL";
    }
    for (const p of draft.paramsSchema) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p.name))
        return `param name "${p.name}" must be a valid identifier`;
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const addParam = () => {
    setDraft({
      ...draft,
      paramsSchema: [
        ...draft.paramsSchema,
        {
          name: "",
          type: "string",
          description: "",
          required: false,
          source: "llm",
        },
      ],
    });
  };

  const updateParam = (i: number, patch: Partial<ToolParam>) => {
    const next = [...draft.paramsSchema];
    next[i] = { ...next[i]!, ...patch };
    setDraft({ ...draft, paramsSchema: next });
  };

  const removeParam = (i: number) => {
    setDraft({
      ...draft,
      paramsSchema: draft.paramsSchema.filter((_, j) => j !== i),
    });
  };

  const headerEntries = Object.entries(draft.headers);

  const updateHeader = (i: number, key: string, value: string) => {
    const entries = [...headerEntries];
    entries[i] = [key, value];
    setDraft({ ...draft, headers: Object.fromEntries(entries) });
  };
  const addHeader = () => {
    setDraft({ ...draft, headers: { ...draft.headers, "": "" } });
  };
  const removeHeader = (key: string) => {
    const next = { ...draft.headers };
    delete next[key];
    setDraft({ ...draft, headers: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "edit tool" : "new tool"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-name">name</Label>
              <Input
                id="t-name"
                placeholder="get_orders"
                value={draft.name}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value.toLowerCase() })
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-method">method</Label>
              <select
                id="t-method"
                value={draft.method}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    method: e.target.value as "GET" | "POST",
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">description</Label>
            <Textarea
              id="t-desc"
              rows={3}
              placeholder="Looks up orders for the current customer by status or date."
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-url">url</Label>
            <Input
              id="t-url"
              placeholder="https://api.your-app.com/orders"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              className="font-mono"
            />
          </div>

          <ParamsEditor
            params={draft.paramsSchema}
            onAdd={addParam}
            onUpdate={updateParam}
            onRemove={removeParam}
          />

          <HeadersEditor
            entries={headerEntries}
            onAdd={addHeader}
            onUpdate={updateHeader}
            onRemove={removeHeader}
          />

          <details className="rounded-md border border-border bg-card p-3 text-sm">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted-foreground">
              advanced
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="t-timeout">timeout (ms)</Label>
                <Input
                  id="t-timeout"
                  type="number"
                  min={1000}
                  max={30000}
                  value={draft.timeoutMs ?? 10000}
                  onChange={(e) =>
                    setDraft({ ...draft, timeoutMs: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-max">max response (bytes)</Label>
                <Input
                  id="t-max"
                  type="number"
                  min={1024}
                  max={1024 * 1024}
                  value={draft.maxResponseBytes ?? 102400}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      maxResponseBytes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </details>

          {error && (
            <p className="text-xs text-destructive" aria-live="polite">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "saving…" : isEdit ? "save changes" : "create tool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParamsEditor({
  params,
  onAdd,
  onUpdate,
  onRemove,
}: {
  params: ToolParam[];
  onAdd: () => void;
  onUpdate: (i: number, patch: Partial<ToolParam>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>parameters</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} /> add param
        </Button>
      </div>

      {params.length === 0 ? null : (
        <ul className="space-y-2">
          {params.map((p, i) => (
            <li
              key={i}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="grid grid-cols-[1.4fr_0.8fr_2fr_auto] items-start gap-2">
                <Input
                  placeholder="name"
                  value={p.name}
                  onChange={(e) => onUpdate(i, { name: e.target.value })}
                  className="h-8 font-mono"
                />
                <select
                  value={p.type}
                  onChange={(e) =>
                    onUpdate(i, { type: e.target.value as ToolParam["type"] })
                  }
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="what this parameter is for"
                  value={p.description}
                  onChange={(e) =>
                    onUpdate(i, { description: e.target.value })
                  }
                  className="h-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(i)}
                  aria-label="Remove parameter"
                  className="h-8 w-8"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </Button>
              </div>
              <label
                className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
                title="The agent must provide this value"
              >
                <input
                  type="checkbox"
                  checked={p.required}
                  onChange={(e) =>
                    onUpdate(i, { required: e.target.checked })
                  }
                  className="h-3.5 w-3.5 cursor-pointer accent-primary"
                />
                required
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HeadersEditor({
  entries,
  onAdd,
  onUpdate,
  onRemove,
}: {
  entries: Array<[string, string]>;
  onAdd: () => void;
  onUpdate: (i: number, key: string, value: string) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>outbound headers</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} /> add header
        </Button>
      </div>

      {entries.length === 0 ? null : (
        <ul className="space-y-2">
          {entries.map(([key, value], i) => {
            const kept = value === HEADER_KEEP;
            return (
              <li
                key={`${i}-${key}`}
                className="grid grid-cols-[1fr_2fr_auto] items-center gap-2"
              >
                <Input
                  placeholder="header name"
                  value={key}
                  onChange={(e) => onUpdate(i, e.target.value, value)}
                  className="h-8 font-mono"
                  disabled={kept}
                />
                {kept ? (
                  <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-muted px-3 font-mono text-xs">
                    <span className="flex-1 tracking-widest text-muted-foreground">
                      ●●●●●●●●
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdate(i, key, "")}
                      className="text-[11px] text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      replace
                    </button>
                  </div>
                ) : (
                  <Input
                    placeholder="value"
                    value={value}
                    onChange={(e) => onUpdate(i, key, e.target.value)}
                    className="h-8 font-mono"
                    autoFocus={key !== "" && value === ""}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(key)}
                  aria-label="Remove header"
                  className="h-8 w-8"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
