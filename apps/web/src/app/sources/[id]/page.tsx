import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { api } from "@/lib/api";
import { AutoRefresh } from "../../_components/auto-refresh";
import { StatusBadge } from "../../_components/status-badge";
import { DeleteSourceButton } from "../../_components/delete-source-button";

export const dynamic = "force-dynamic";

const LEVEL_ICON = {
  info: InformationCircleIcon,
  warn: Alert02Icon,
  error: Cancel01Icon,
} as const;

const LEVEL_CLASS: Record<string, string> = {
  info: "text-muted-foreground",
  warn: "text-warning",
  error: "text-destructive",
};

export default async function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let source: Awaited<ReturnType<typeof api.getSource>>["source"] | null = null;
  let events: Awaited<ReturnType<typeof api.getSourceEvents>>["events"] = [];
  let error: string | null = null;
  try {
    const [s, e] = await Promise.all([
      api.getSource(id),
      api.getSourceEvents(id),
    ]);
    source = s.source;
    events = e.events;
  } catch (err) {
    error = String(err);
  }

  if (error || !source) {
    return (
      <div className="space-y-4">
        <a href="/" className="text-sm text-muted-foreground">
          ← back
        </a>
        <p className="text-sm text-destructive">
          source not found · {error}
        </p>
      </div>
    );
  }

  const isInFlight =
    source.status === "queued" || source.status === "processing";

  return (
    <div className="space-y-10">
      <AutoRefresh enabled={isInFlight} intervalMs={2000} />

      <div className="flex items-center justify-between">
        <a href="/" className="text-sm text-muted-foreground hover:opacity-80">
          ← back
        </a>
        <DeleteSourceButton id={source.id} name={source.name} />
      </div>

      <header className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="truncate text-2xl">{source.name}</h1>
          <StatusBadge status={source.status} progress={source.progress} />
        </div>
        <p className="text-xs text-muted-foreground">
          {source.type} · <span className="font-mono">{source.id.slice(0, 8)}</span> · created{" "}
          {new Date(source.createdAt).toLocaleString()}
        </p>

        {source.status === "processing" && (
          <div className="h-1 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${source.progress}%` }}
            />
          </div>
        )}

        {source.error && (
          <p className="text-xs text-destructive">{source.error}</p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          events
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">no events yet.</p>
        ) : (
          <ol className="divide-y divide-border rounded-md border border-border">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start gap-3 px-3 py-2.5 text-sm"
              >
                <span
                  className={`mt-0.5 flex-shrink-0 ${LEVEL_CLASS[ev.level]}`}
                  aria-label={ev.level}
                  title={ev.level}
                >
                  <HugeiconsIcon icon={LEVEL_ICON[ev.level]} size={14} />
                </span>
                <span className="min-w-[5.5rem] flex-shrink-0 text-xs text-muted-foreground">
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </span>
                <span className="flex-1 leading-snug">{ev.message}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
