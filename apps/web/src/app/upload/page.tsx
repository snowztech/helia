"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";

type Tab = "pdf" | "text" | "url";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; id: string }
  | { kind: "error"; msg: string };

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
      if (res.error) {
        setStatus({ kind: "error", msg: res.error });
        toast.error(res.error);
      } else {
        setStatus({ kind: "ok", id: res.source.id });
        toast.success("source created");
        // Take the user straight to the timeline so they see ingest progress.
        router.push(`/sources/${res.source.id}`);
      }
    } catch (err) {
      setStatus({ kind: "error", msg: String(err) });
      toast.error(String(err));
    }
  };

  const busy = status.kind === "loading";

  return (
    <div className="space-y-6">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:opacity-80"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> back
      </a>

      <header>
        <h1 className="text-2xl">add a source.</h1>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="pdf">pdf</TabsTrigger>
          <TabsTrigger value="text">text</TabsTrigger>
          <TabsTrigger value="url">website</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <PdfForm wrap={wrap} busy={busy} />
        </TabsContent>
        <TabsContent value="text">
          <TextForm wrap={wrap} busy={busy} />
        </TabsContent>
        <TabsContent value="url">
          <UrlForm wrap={wrap} busy={busy} />
        </TabsContent>
      </Tabs>

      {status.kind === "ok" && (
        <p className="text-sm text-success" aria-live="polite">
          ✓ source created ·{" "}
          <a
            href={`/sources/${status.id}`}
            className="underline hover:opacity-80"
          >
            view timeline →
          </a>
        </p>
      )}
    </div>
  );
}

type FormProps = {
  wrap: (
    run: () => Promise<{ source: { id: string }; error?: string }>,
  ) => Promise<void>;
  busy: boolean;
};

function PdfForm({ wrap, busy }: FormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const file = fd.get("file");
        if (!(file instanceof File) || file.size === 0) {
          toast.error("Choose a PDF");
          return;
        }
        void wrap(() => api.uploadPdf(file));
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="pdf-file">file</Label>
        <Input
          id="pdf-file"
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-medium"
        />
      </div>
      <SubmitButton busy={busy} idle="upload pdf" busyLabel="ingesting…" />
    </form>
  );
}

function TextForm({ wrap, busy }: FormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "");
        const text = String(fd.get("text") ?? "");
        void wrap(() => api.uploadText(name, text));
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="text-name">name</Label>
        <Input
          id="text-name"
          name="name"
          placeholder="source name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="text-body">content</Label>
        <Textarea
          id="text-body"
          name="text"
          rows={6}
          placeholder="paste your text…"
          required
        />
      </div>
      <SubmitButton busy={busy} idle="upload text" busyLabel="ingesting…" />
    </form>
  );
}

function UrlForm({ wrap, busy }: FormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const url = String(fd.get("url") ?? "");
        const maxPages = Number(fd.get("maxPages")) || 50;
        void wrap(() => api.uploadUrl(url, maxPages));
      }}
    >
      <p className="text-xs text-muted-foreground">
        Same host only · respects robots.txt · Mozilla Readability extraction.
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-2">
          <Label htmlFor="url-input">seed url</Label>
          <Input
            id="url-input"
            type="url"
            name="url"
            placeholder="https://example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url-max">max pages</Label>
          <Input
            id="url-max"
            type="number"
            name="maxPages"
            defaultValue={50}
            min={1}
            max={200}
            className="w-24"
          />
        </div>
      </div>
      <SubmitButton busy={busy} idle="crawl website" busyLabel="queuing…" />
    </form>
  );
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
    <Button type="submit" disabled={busy}>
      {busy ? busyLabel : idle}
    </Button>
  );
}
