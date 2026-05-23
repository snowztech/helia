"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { api, type Workspace } from "@/lib/api";

type Props = {
  workspaceId: string;
  identityRequired: boolean;
  identityConfigured: boolean;
  onWorkspace: (ws: Workspace) => void;
};

export function IdentitySection({
  workspaceId,
  identityRequired,
  identityConfigured,
  onWorkspace,
}: Props) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [togglingRequired, setTogglingRequired] = useState(false);

  async function rotate() {
    setRotating(true);
    try {
      const res = await api.rotateIdentitySecret();
      setRevealed(res.secret);
      // Surface the configured flag without a full refetch.
      onWorkspace({
        ...(await api.getWorkspace().then((r) => r.workspace)),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "rotate failed");
    } finally {
      setRotating(false);
    }
  }

  async function toggleRequired(next: boolean) {
    setTogglingRequired(true);
    try {
      const { workspace } = await api.patchWorkspace({
        identityRequired: next,
      });
      onWorkspace(workspace);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "save failed");
    } finally {
      setTogglingRequired(false);
    }
  }

  async function copySecret() {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
      toast.success("secret copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("could not copy");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Signing secret</p>
          <p className="text-xs text-muted-foreground">
            Used by your backend to sign each end-user identity. Shown once
            when generated.
          </p>
        </div>
        {identityConfigured ? (
          <Badge className="whitespace-nowrap">configured</Badge>
        ) : (
          <Badge variant="warning" className="whitespace-nowrap">
            not set
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <Label className="text-sm font-normal normal-case tracking-normal text-foreground">
            Reject anonymous chats
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Turn on once your widget is sending signed identities.
          </p>
        </div>
        <Switch
          checked={identityRequired}
          disabled={togglingRequired || (!identityConfigured && !identityRequired)}
          onCheckedChange={toggleRequired}
        />
      </div>

      {revealed ? (
        <div className="space-y-2 rounded-md border border-warning/40 bg-warning/5 p-4">
          <p className="text-xs font-medium">
            Copy this now. Helia will not show it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-background px-3 py-1.5 text-xs">
              {revealed}
            </code>
            <Button size="sm" variant="outline" onClick={copySecret}>
              <HugeiconsIcon
                icon={copied ? Tick02Icon : Copy01Icon}
                size={14}
              />
              {copied ? "copied" : "copy"}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRevealed(null)}
          >
            I've stored it safely
          </Button>
        </div>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={rotating}>
              {identityConfigured ? "Generate new secret..." : "Generate secret..."}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {identityConfigured
                  ? "Generate a new signing secret?"
                  : "Generate signing secret?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {identityConfigured
                  ? "The current secret stops working immediately. Any backend still signing with the old value will start failing until you deploy the new one."
                  : "Creates a new HMAC key for this workspace. You'll see it once. Store it in your backend env (e.g. HELIA_IDENTITY_SECRET)."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void rotate();
                }}
              >
                {identityConfigured ? "Generate new" : "Generate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <IntegrationGuide
        workspaceId={workspaceId}
        defaultOpen={!identityConfigured}
      />
    </div>
  );
}

function IntegrationGuide({
  workspaceId,
  defaultOpen,
}: {
  workspaceId: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-md border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Integration guide</p>
          <p className="text-[11px] text-muted-foreground">
            Two steps: sign on your backend, point the widget at your route.
          </p>
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          className={
            "flex-shrink-0 text-muted-foreground transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-4">
          <CodeSamples workspaceId={workspaceId} />
        </div>
      )}
    </div>
  );
}

function CodeSamples({ workspaceId }: { workspaceId: string }) {
  const [tab, setTab] = useState<"node" | "next">("node");
  const backendCode = tab === "node" ? NODE_SAMPLE : NEXT_SAMPLE;

  const embedSnippet = `<script src="https://helia.snowztech.com/w.js"
        data-workspace="${workspaceId}"
        data-token-endpoint="/helia-token"
        async></script>`;

  return (
    <div className="space-y-5">
      <Step
        number={1}
        title="Add a backend route that signs the user"
        description="Reads your logged-in user from your own auth (sessions, JWT, whatever you already use) and returns a signed identity. Helia verifies the signature with the secret above."
      >
        <CodeBlock
          code={backendCode}
          language="ts"
          tabs={
            <div className="inline-flex items-center gap-0.5 rounded-md bg-zinc-900 p-0.5">
              <TabButton active={tab === "node"} onClick={() => setTab("node")}>
                Node / Express
              </TabButton>
              <TabButton active={tab === "next"} onClick={() => setTab("next")}>
                Next.js
              </TabButton>
            </div>
          }
        />
      </Step>

      <Step
        number={2}
        title="Point the widget at your route"
        description="Add data-token-endpoint to your script tag. The widget fetches the signed token on every page load."
      >
        <CodeBlock code={embedSnippet} language="html" />
      </Step>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
          {number}
        </span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="pl-7 text-xs text-muted-foreground">{description}</p>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded px-2 py-1 text-[11px] transition-colors " +
        (active
          ? "bg-zinc-700 text-zinc-100"
          : "text-zinc-400 hover:text-zinc-100")
      }
    >
      {children}
    </button>
  );
}

function CodeBlock({
  code,
  language,
  tabs,
}: {
  code: string;
  language: string;
  tabs?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("could not copy");
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-2 py-1.5">
        {tabs ?? (
          <span className="px-1 text-[10px] uppercase tracking-wider text-zinc-500">
            {language}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            size={12}
          />
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-auto p-3 text-[12px] leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const NODE_SAMPLE = `import crypto from "node:crypto";
import express from "express";

const app = express();

app.get("/helia-token", (req, res) => {
  const user = req.user; // your auth middleware
  const payload = user.name
    ? { id: user.id, name: user.name }
    : { id: user.id };

  const signature = crypto
    .createHmac("sha256", process.env.HELIA_IDENTITY_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  res.json({ ...payload, signature });
});`;

const NEXT_SAMPLE = `// app/api/helia-token/route.ts
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const payload = session.user.name
    ? { id: session.user.id, name: session.user.name }
    : { id: session.user.id };

  const signature = crypto
    .createHmac("sha256", process.env.HELIA_IDENTITY_SECRET!)
    .update(JSON.stringify(payload))
    .digest("hex");

  return NextResponse.json({ ...payload, signature });
}`;
