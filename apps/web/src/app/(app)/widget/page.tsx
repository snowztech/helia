"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Copy01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { api, type Workspace } from "@/lib/api";
import { useWorkspace } from "../_components/workspace-provider";
import {
  WidgetPreview,
  type PreviewConfig,
} from "./_components/widget-preview";

const PRESETS = [
  "#0ea5e9",
  "#6366f1",
  "#22c55e",
  "#f43f5e",
  "#f59e0b",
  "#14b8a6",
  "#a855f7",
  "#0b0b0b",
];
const RADIUS_PRESETS = [0, 8, 14, 22];
const WIDGET_PROD_URL = "https://helia.snowztech.com/w.js";

// Fields we persist on save. Everything else on the workspace is read-only here.
const EDITABLE_FIELDS = [
  "brandPrimary",
  "botName",
  "botSubtitle",
  "botGreeting",
  "botPlaceholder",
  "botSuggestions",
  "botAvatar",
  "widgetPosition",
  "widgetTheme",
  "widgetRadius",
] as const;

type EditableSnapshot = Pick<Workspace, (typeof EDITABLE_FIELDS)[number]>;

function snapshot(ws: Workspace): EditableSnapshot {
  return {
    brandPrimary: ws.brandPrimary,
    botName: ws.botName,
    botSubtitle: ws.botSubtitle,
    botGreeting: ws.botGreeting,
    botPlaceholder: ws.botPlaceholder,
    botSuggestions: ws.botSuggestions,
    botAvatar: ws.botAvatar,
    widgetPosition: ws.widgetPosition,
    widgetTheme: ws.widgetTheme,
    widgetRadius: ws.widgetRadius,
  };
}

function shallowEqual(a: EditableSnapshot, b: EditableSnapshot): boolean {
  for (const k of EDITABLE_FIELDS) {
    if (k === "botSuggestions") {
      const av = a.botSuggestions;
      const bv = b.botSuggestions;
      if (av.length !== bv.length) return false;
      for (let i = 0; i < av.length; i++) {
        if (av[i] !== bv[i]) return false;
      }
      continue;
    }
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export default function WidgetPage() {
  const { refresh: refreshGlobalWorkspace } = useWorkspace();
  const [ws, setWs] = useState<Workspace | null>(null);
  const [saved, setSaved] = useState<EditableSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getWorkspace()
      .then(({ workspace }) => {
        setWs(workspace);
        setSaved(snapshot(workspace));
      })
      .catch((err: Error) => toast.error(err.message ?? "load failed"))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => {
    if (!ws || !saved) return false;
    return !shallowEqual(snapshot(ws), saved);
  }, [ws, saved]);

  if (loading || !ws) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[620px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const config: PreviewConfig = {
    workspaceId: ws.id,
    primary: ws.brandPrimary,
    position: ws.widgetPosition,
    theme: ws.widgetTheme,
    radius: ws.widgetRadius,
    botName: ws.botName,
    botSubtitle: ws.botSubtitle,
    botGreeting: ws.botGreeting,
    botPlaceholder: ws.botPlaceholder,
    suggestions: ws.botSuggestions,
    botAvatar: ws.botAvatar,
  };

  const snippet = `<script src="${WIDGET_PROD_URL}" data-workspace="${ws.id}" async></script>`;

  const save = async () => {
    setSaving(true);
    try {
      const { workspace } = await api.patchWorkspace(snapshot(ws));
      setWs(workspace);
      setSaved(snapshot(workspace));
      void refreshGlobalWorkspace();
      toast.success("widget saved");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("snippet copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("could not copy");
    }
  };

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-6 flex items-end justify-between border-b border-border-subtle bg-background px-6 py-3">
        <div className="space-y-1">
          <h1 className="text-2xl">widget.</h1>
          <p className="text-xs text-muted-foreground">
            Customize the widget. Save when ready.
          </p>
        </div>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? "saving…" : dirty ? "save" : "saved"}
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Section title="Brand color">
            <div className="flex items-center gap-3">
              <Input
                value={ws.brandPrimary}
                onChange={(e) =>
                  setWs({ ...ws, brandPrimary: e.target.value })
                }
                pattern="^#[0-9a-fA-F]{6}$"
                className="w-32 font-mono"
              />
              <div className="flex gap-2">
                {PRESETS.map((c) => {
                  const active = ws.brandPrimary.toLowerCase() === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      data-shadcn=""
                      aria-label={`pick ${c}`}
                      onClick={() => setWs({ ...ws, brandPrimary: c })}
                      className={cn(
                        "h-6 w-6 rounded-full border transition-transform",
                        active
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : "border-border hover:scale-110",
                      )}
                      style={{ background: c }}
                    />
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Branding">
            <div className="space-y-4">
              <Field label="bot avatar">
                <Input
                  value={ws.botAvatar ?? ""}
                  onChange={(e) =>
                    setWs({
                      ...ws,
                      botAvatar: e.target.value.length ? e.target.value : null,
                    })
                  }
                  placeholder="image URL or a single emoji"
                  maxLength={500}
                />
              </Field>
            </div>
          </Section>

          <Section title="Wording">
            <div className="space-y-4">
              <Field label="title">
                <Input
                  value={ws.botName}
                  onChange={(e) => setWs({ ...ws, botName: e.target.value })}
                  maxLength={40}
                />
              </Field>
              <Field label="subtitle">
                <Input
                  value={ws.botSubtitle}
                  onChange={(e) =>
                    setWs({ ...ws, botSubtitle: e.target.value })
                  }
                  maxLength={120}
                />
              </Field>
              <Field label="greeting">
                <Textarea
                  value={ws.botGreeting}
                  onChange={(e) =>
                    setWs({ ...ws, botGreeting: e.target.value })
                  }
                  rows={2}
                  maxLength={280}
                />
              </Field>
              <Field label="input placeholder">
                <Input
                  value={ws.botPlaceholder}
                  onChange={(e) =>
                    setWs({ ...ws, botPlaceholder: e.target.value })
                  }
                  maxLength={60}
                />
              </Field>
            </div>
          </Section>

          <Section title="Suggested questions">
            <SuggestionsEditor
              suggestions={ws.botSuggestions}
              onChange={(next) => setWs({ ...ws, botSuggestions: next })}
            />
          </Section>

          <Section title="Layout">
            <div className="space-y-4">
              <Field label="position">
                <SegGroup
                  options={[
                    { value: "bottom-left", label: "bottom-left" },
                    { value: "bottom-right", label: "bottom-right" },
                  ]}
                  value={ws.widgetPosition}
                  onChange={(v) =>
                    setWs({
                      ...ws,
                      widgetPosition: v as "bottom-left" | "bottom-right",
                    })
                  }
                />
              </Field>
              <Field label="theme">
                <SegGroup
                  options={[
                    { value: "light", label: "light" },
                    { value: "dark", label: "dark" },
                    { value: "auto", label: "auto" },
                  ]}
                  value={ws.widgetTheme}
                  onChange={(v) =>
                    setWs({
                      ...ws,
                      widgetTheme: v as "light" | "dark" | "auto",
                    })
                  }
                />
              </Field>
              <Field label="corner radius">
                <SegGroup
                  options={RADIUS_PRESETS.map((r) => ({
                    value: String(r),
                    label: `${r}px`,
                  }))}
                  value={String(ws.widgetRadius)}
                  onChange={(v) =>
                    setWs({ ...ws, widgetRadius: Number(v) })
                  }
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Live preview">
            <WidgetPreview config={config} />
          </Section>

          <Section title="Install">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  html
                </span>
                <Button size="sm" variant="ghost" onClick={copy}>
                  <HugeiconsIcon
                    icon={copied ? Tick02Icon : Copy01Icon}
                    size={14}
                  />
                  {copied ? "copied" : "copy"}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                {snippet}
              </pre>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Showing this to logged-in users? Set up{" "}
                <Link
                  href="/settings#user-identity"
                  className="text-foreground underline underline-offset-2 hover:no-underline"
                >
                  user identity
                </Link>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="block text-xs font-normal normal-case tracking-normal text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SegGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            data-shadcn=""
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SuggestionsEditor({
  suggestions,
  onChange,
}: {
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (suggestions.length >= 6) {
      toast.error("max 6 suggestions");
      return;
    }
    onChange([...suggestions, v]);
    setDraft("");
  };

  const remove = (i: number) => {
    onChange(suggestions.filter((_, j) => j !== i));
  };

  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {suggestions.map((q, i) => (
            <li
              key={`${i}-${q}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
            >
              {q}
              <button
                type="button"
                data-shadcn=""
                aria-label={`remove ${q}`}
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="how do I get started?"
          maxLength={120}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} /> add
        </Button>
      </div>
    </div>
  );
}
