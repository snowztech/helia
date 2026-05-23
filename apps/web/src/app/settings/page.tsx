"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { api, type SystemInfo, type Workspace } from "@/lib/api";
import { useWorkspace } from "../_components/workspace-provider";

// Models we expose in the dropdown. The DB column accepts any string so
// power-users can paste whatever they want, but typical usage picks one of
// these.
const MODELS = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini · fast, cheap" },
  { value: "gpt-4o", label: "gpt-4o · capable, costly" },
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
];

export default function SettingsPage() {
  const { refresh: refreshGlobalWorkspace } = useWorkspace();
  const [ws, setWs] = useState<Workspace | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<{
    name: string;
    locale: string;
    model: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    Promise.all([api.getWorkspace(), api.getSystem()])
      .then(([w, s]) => {
        setWs(w.workspace);
        setSystem(s);
        setSavedSnapshot({
          name: w.workspace.name,
          locale: w.workspace.locale,
          model: w.workspace.model,
        });
      })
      .catch((err: Error) => toast.error(err.message ?? "load failed"))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => {
    if (!ws || !savedSnapshot) return false;
    return (
      ws.name !== savedSnapshot.name ||
      ws.locale !== savedSnapshot.locale ||
      ws.model !== savedSnapshot.model
    );
  }, [ws, savedSnapshot]);

  if (loading || !ws || !system) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(ws.id);
      setCopiedId(true);
      toast.success("workspace id copied");
      setTimeout(() => setCopiedId(false), 1500);
    } catch {
      toast.error("could not copy");
    }
  };

  const save = async () => {
    if (!ws) return;
    setSaving(true);
    try {
      const { workspace } = await api.patchWorkspace({
        name: ws.name,
        locale: ws.locale,
        model: ws.model,
      });
      setWs(workspace);
      setSavedSnapshot({
        name: workspace.name,
        locale: workspace.locale,
        model: workspace.model,
      });
      // Propagate to anything reading from the workspace context (header
      // chip, future widgets).
      void refreshGlobalWorkspace();
      toast.success("settings saved");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-6 flex items-end justify-between gap-4 border-b border-border-subtle bg-background px-6 py-3">
        <div className="space-y-1">
          <h1 className="text-2xl">settings.</h1>
          <p className="text-xs text-muted-foreground">
            Configure your workspace, AI model, and inspect system state.
          </p>
        </div>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? "saving…" : dirty ? "save" : "saved"}
        </Button>
      </header>

      <Section title="Workspace">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>workspace id</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-1.5 text-xs">
                {ws.id}
              </code>
              <Button size="sm" variant="outline" onClick={copyId}>
                <HugeiconsIcon
                  icon={copiedId ? Tick02Icon : Copy01Icon}
                  size={14}
                />
                {copiedId ? "copied" : "copy"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Baked into the widget snippet. Read-only.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-name">name</Label>
            <Input
              id="ws-name"
              value={ws.name}
              onChange={(e) => setWs({ ...ws, name: e.target.value })}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-locale">locale</Label>
            <SelectInput
              id="ws-locale"
              value={ws.locale}
              onChange={(v) => setWs({ ...ws, locale: v })}
              options={LOCALES}
            />
            <p className="text-[11px] text-muted-foreground">
              Hints the agent's reply language.
            </p>
          </div>
        </div>
      </Section>

      <Section title="AI">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>provider</Label>
              <div className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm capitalize">
                {system.provider}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">model</Label>
              <SelectInput
                id="model"
                value={ws.model}
                onChange={(v) => setWs({ ...ws, model: v })}
                options={MODELS}
                allowCustom
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>api key</Label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
              <KeyStatusDot ok={system.keyConfigured} />
              <span className="text-sm">
                {system.keyConfigured ? "configured" : "not configured"}
              </span>
              <code className="ml-auto text-[11px] text-muted-foreground">
                OPENAI_API_KEY
              </code>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {system.keyConfigured ? (
                <>
                  Set in <code>apps/api/.env</code>. UI-managed keys land in
                  the next release.
                </>
              ) : (
                <>
                  Set <code>OPENAI_API_KEY</code> in <code>apps/api/.env</code>{" "}
                  and restart the API. Chat will not work until configured.
                </>
              )}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Embed allowlist">
        <div className="space-y-2">
          {system.allowedOrigins === "wildcard" ? (
            <Badge variant="warning">any origin allowed (dev wildcard)</Badge>
          ) : system.allowedOrigins === "dev-localhost" ? (
            <Badge>any localhost origin (dev only)</Badge>
          ) : system.allowedOrigins.length === 0 ? (
            <Badge variant="destructive">no origins configured</Badge>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {system.allowedOrigins.map((o) => (
                <li key={o}>
                  <code className="rounded-md border border-border bg-muted px-2 py-1 text-xs">
                    {o}
                  </code>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            Set with <code>HELIA_CORS_ORIGIN</code> in <code>apps/api/.env</code>{" "}
            — comma-separated origins for production.
          </p>
        </div>
      </Section>

      <Section title="System">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">version</dt>
            <dd>v{system.version}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">environment</dt>
            <dd className="capitalize">{system.nodeEnv}</dd>
          </div>
        </dl>
      </Section>
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
      <div className="rounded-lg border border-border bg-card p-5">
        {children}
      </div>
    </section>
  );
}

function SelectInput({
  id,
  value,
  onChange,
  options,
  allowCustom,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  allowCustom?: boolean;
}) {
  const known = options.some((o) => o.value === value);
  return (
    <select
      id={id}
      value={known ? value : allowCustom ? "__custom__" : value}
      onChange={(e) => {
        if (e.target.value !== "__custom__") onChange(e.target.value);
      }}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      {allowCustom && !known && (
        <option value="__custom__">custom: {value}</option>
      )}
    </select>
  );
}

function KeyStatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        ok ? "bg-success" : "bg-destructive",
      )}
      aria-hidden="true"
    />
  );
}

