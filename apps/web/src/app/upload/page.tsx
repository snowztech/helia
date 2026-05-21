"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Input, Textarea } from "@snowztech/ui";
import { api } from "@/lib/api";

type Tab = "pdf" | "text" | "url";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; id: string }
  | { kind: "error"; msg: string };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "pdf", label: "pdf" },
  { id: "text", label: "text" },
  { id: "url", label: "website" },
];

export default function UploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pdf");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const wrap = async (
    run: () => Promise<{ source: { id: string }; error?: string }>,
  ) => {
    setStatus({ kind: "loading" });
    try {
      const res = await run();
      if (res.error) setStatus({ kind: "error", msg: res.error });
      else {
        setStatus({ kind: "ok", id: res.source.id });
        router.refresh();
      }
    } catch (err) {
      setStatus({ kind: "error", msg: String(err) });
    }
  };

  const busy = status.kind === "loading";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl">add a source.</h1>
        <p className="muted text-xs">
          PDF and text ingest synchronously · URL crawls run in the background.
        </p>
      </header>

      <nav
        className="flex gap-5 border-b text-sm"
        style={{ borderColor: "var(--sn-border-subtle)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setStatus({ kind: "idle" });
              }}
              className="pb-2 pt-1 transition-opacity"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: active
                  ? "1px solid var(--sn-accent)"
                  : "1px solid transparent",
                color: active ? "var(--sn-fg)" : "var(--sn-fg-muted)",
                marginBottom: "-1px",
                cursor: "pointer",
                padding: "0.25rem 0 0.5rem",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "pdf" && <PdfForm wrap={wrap} busy={busy} onError={(msg) => setStatus({ kind: "error", msg })} />}
      {tab === "text" && <TextForm wrap={wrap} busy={busy} />}
      {tab === "url" && <UrlForm wrap={wrap} busy={busy} />}

      <StatusLine status={status} />
    </div>
  );
}

// ─── forms ────────────────────────────────────────────────────────────────

type FormProps = {
  wrap: (run: () => Promise<{ source: { id: string }; error?: string }>) => Promise<void>;
  busy: boolean;
};

function PdfForm({ wrap, busy, onError }: FormProps & { onError: (msg: string) => void }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const file = fd.get("file");
        if (!(file instanceof File) || file.size === 0) {
          onError("Choose a PDF");
          return;
        }
        void wrap(() => api.uploadPdf(file));
      }}
    >
      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="sn-file"
      />
      <SubmitButton busy={busy} idle="upload pdf →" busyLabel="ingesting…" />
    </form>
  );
}

function TextForm({ wrap, busy }: FormProps) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "");
        const text = String(fd.get("text") ?? "");
        void wrap(() => api.uploadText(name, text));
      }}
    >
      <Field label="name" htmlFor="text-name" required>
        <Input id="text-name" name="name" placeholder="source name" required />
      </Field>
      <Field label="content" htmlFor="text-body" required>
        <Textarea
          id="text-body"
          name="text"
          rows={4}
          placeholder="paste your text…"
          required
        />
      </Field>
      <SubmitButton busy={busy} idle="upload text →" busyLabel="ingesting…" />
    </form>
  );
}

function UrlForm({ wrap, busy }: FormProps) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const url = String(fd.get("url") ?? "");
        const maxPages = Number(fd.get("maxPages")) || 50;
        void wrap(() => api.uploadUrl(url, maxPages));
      }}
    >
      <p className="subtle text-xs leading-relaxed">
        Same host only · respects robots.txt · Mozilla Readability extraction.
      </p>
      <div className="flex gap-3">
        <Field label="seed url" htmlFor="url-input" required>
          <Input
            id="url-input"
            type="url"
            name="url"
            placeholder="https://example.com"
            required
          />
        </Field>
        <Field label="max pages" htmlFor="url-max">
          <Input
            id="url-max"
            type="number"
            name="maxPages"
            defaultValue={50}
            min={1}
            max={200}
            style={{ width: "5rem" }}
          />
        </Field>
      </div>
      <SubmitButton busy={busy} idle="crawl website →" busyLabel="queuing…" />
    </form>
  );
}

// ─── feedback line ────────────────────────────────────────────────────────

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "ok") {
    return (
      <p className="text-sm" style={{ color: "var(--sn-success)" }} aria-live="polite">
        ✓ source created ·{" "}
        <a href={`/sources/${status.id}`} className="underline">
          view timeline →
        </a>
      </p>
    );
  }
  if (status.kind === "error") {
    return (
      <p className="text-sm" style={{ color: "var(--sn-danger)" }} aria-live="polite">
        error · {status.msg}
      </p>
    );
  }
  return null;
}

function SubmitButton({
  busy,
  idle,
  busyLabel,
}: {
  busy: boolean;
  idle: string;
  busyLabel: string;
}) {
  return (
    <button type="submit" disabled={busy} className="sn-btn sn-btn--accent">
      {busy ? busyLabel : idle}
    </button>
  );
}
