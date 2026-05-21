"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { api, type Workspace } from "@/lib/api";
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

export default function WidgetPage() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getWorkspace()
      .then(({ workspace }) => setWs(workspace))
      .catch((err: Error) => toast.error(err.message ?? "load failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !ws) {
    return <p className="text-sm text-muted-foreground">loading…</p>;
  }

  const dirty = false; // for now we trust local state, post on save

  const config: PreviewConfig = {
    primary: ws.brandPrimary,
    position: ws.widgetPosition,
    theme: ws.widgetTheme,
    radius: ws.widgetRadius,
    botName: ws.botName,
    botSubtitle: ws.botSubtitle,
    botGreeting: ws.botGreeting,
    botPlaceholder: ws.botPlaceholder,
  };

  const snippet = `<script src="${WIDGET_PROD_URL}" data-workspace="${ws.id}" async></script>`;

  const save = async () => {
    setSaving(true);
    try {
      const { workspace } = await api.patchWorkspace({
        brandPrimary: ws.brandPrimary,
        botName: ws.botName,
        botSubtitle: ws.botSubtitle,
        botGreeting: ws.botGreeting,
        botPlaceholder: ws.botPlaceholder,
        widgetPosition: ws.widgetPosition,
        widgetTheme: ws.widgetTheme,
        widgetRadius: ws.widgetRadius,
      });
      setWs(workspace);
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
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl">widget.</h1>
          <p className="text-xs text-muted-foreground">
            Customize how the widget looks. Test it live on the right.
            Hit save when it's ready.
          </p>
        </div>
        <Button onClick={save} disabled={saving || dirty}>
          {saving ? "saving…" : "save"}
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

          <Section title="Copy">
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
            <p className="mb-3 text-xs text-muted-foreground">
              Click the launcher to test the assistant. Messages go through
              your real agent.
            </p>
            <WidgetPreview config={config} />
          </Section>

          <Section title="Install">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  html
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-[11px] leading-relaxed">
                  {snippet}
                </pre>
                <Button size="sm" onClick={copy}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "copied" : "copy snippet"}
                </Button>
              </CardContent>
            </Card>
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
      <Label>{label}</Label>
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
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            data-shadcn=""
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[5px] px-3 py-1 text-xs transition-colors",
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
