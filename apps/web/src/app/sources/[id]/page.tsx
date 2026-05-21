import { api } from "@/lib/api";
import { AutoRefresh } from "../../_components/auto-refresh";
import { StatusBadge } from "../../_components/status-badge";
import { DeleteSourceButton } from "../../_components/delete-source-button";

export const dynamic = "force-dynamic";

const LEVEL_COLOR: Record<string, string> = {
  info: "var(--sn-fg-muted)",
  warn: "var(--sn-warning)",
  error: "var(--sn-danger)",
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
    const [s, e] = await Promise.all([api.getSource(id), api.getSourceEvents(id)]);
    source = s.source;
    events = e.events;
  } catch (err) {
    error = String(err);
  }

  if (error || !source) {
    return (
      <div className="space-y-4">
        <a href="/" className="subtle text-sm">
          ← back
        </a>
        <p style={{ color: "var(--sn-danger)" }} className="text-sm">
          source not found · {error}
        </p>
      </div>
    );
  }

  const isInFlight = source.status === "queued" || source.status === "processing";

  return (
    <div className="space-y-10">
      <AutoRefresh enabled={isInFlight} intervalMs={2000} />

      <div className="flex items-center justify-between">
        <a href="/" className="subtle text-sm hover:opacity-80">
          ← back
        </a>
        <DeleteSourceButton id={source.id} name={source.name} />
      </div>

      <header className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="truncate text-2xl">{source.name}</h1>
          <StatusBadge status={source.status} progress={source.progress} />
        </div>
        <p className="subtle text-xs">
          {source.type} · {source.id} · created{" "}
          {new Date(source.createdAt).toLocaleString()}
        </p>

        {source.status === "processing" && (
          <div
            className="h-1 w-full overflow-hidden"
            style={{ background: "var(--sn-bg-inset)" }}
          >
            <div
              className="h-full transition-all"
              style={{ width: `${source.progress}%`, background: "var(--sn-accent)" }}
            />
          </div>
        )}

        {source.error && (
          <p className="text-xs" style={{ color: "var(--sn-danger)" }}>
            {source.error}
          </p>
        )}
      </header>

      <section>
        <h2 className="subtle mb-3 text-[11px] uppercase tracking-[0.18em]">
          events
        </h2>
        {events.length === 0 ? (
          <p className="subtle text-sm">no events yet.</p>
        ) : (
          <ol className="space-y-px">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-baseline gap-3 border-b py-2 text-sm"
                style={{ borderColor: "var(--sn-border-subtle)" }}
              >
                <span className="subtle min-w-[5.5rem] text-xs">
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </span>
                <span
                  className="min-w-[3rem] text-[10px] uppercase tracking-wider"
                  style={{ color: LEVEL_COLOR[ev.level] }}
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
