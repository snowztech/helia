import { api } from "@/lib/api";
import { AutoRefresh } from "../../_components/auto-refresh";
import { StatusBadge } from "../../_components/status-badge";
import { DeleteSourceButton } from "../../_components/delete-source-button";

export const dynamic = "force-dynamic";

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
          {source.type} · {source.id} · created{" "}
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
                className="flex items-baseline gap-3 px-3 py-2 text-sm"
              >
                <span className="min-w-[5.5rem] text-xs text-muted-foreground">
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </span>
                <span
                  className={`min-w-[3rem] text-[10px] uppercase tracking-wider ${LEVEL_CLASS[ev.level]}`}
                >
                  {ev.level}
                </span>
                <span className="flex-1">{ev.message}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
