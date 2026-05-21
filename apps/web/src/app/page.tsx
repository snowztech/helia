import { api } from "@/lib/api";
import { AutoRefresh } from "./_components/auto-refresh";
import { StatusBadge } from "./_components/status-badge";
import { DeleteSourceButton } from "./_components/delete-source-button";
import { QuickAsk } from "./_components/quick-ask";

export const dynamic = "force-dynamic";

export default async function Home() {
  let sources: Awaited<ReturnType<typeof api.listSources>>["sources"] = [];
  let apiError: string | null = null;
  try {
    const res = await api.listSources();
    sources = res.sources;
  } catch (err) {
    apiError = String(err);
  }

  const counts = {
    queued: sources.filter((s) => s.status === "queued").length,
    processing: sources.filter((s) => s.status === "processing").length,
    ready: sources.filter((s) => s.status === "ready").length,
    failed: sources.filter((s) => s.status === "failed").length,
  };
  const hasInFlight = counts.queued > 0 || counts.processing > 0;

  return (
    <div className="space-y-12">
      <AutoRefresh enabled={hasInFlight} intervalMs={2000} />

      <section className="space-y-3">
        <h1 className="text-3xl">
          turn your <span className="accent">docs</span> into an{" "}
          <span className="accent">ai assistant</span>.
        </h1>
        <p className="muted text-sm leading-relaxed">
          Upload PDFs, paste text, or crawl a website. Then chat with them.
        </p>
        <div className="flex gap-2 pt-2">
          <a href="/upload" className="sn-btn sn-btn--accent sn-btn--sm">
            add source →
          </a>
          <a href="/chat" className="sn-btn sn-btn--ghost sn-btn--sm">
            open chat →
          </a>
        </div>

        <div className="pt-4">
          <QuickAsk />
        </div>
      </section>

      {apiError && (
        <section className="sn-card p-4 text-sm">
          <span style={{ color: "var(--sn-danger)" }}>api unreachable</span>{" "}
          <span className="muted">— run </span>
          <code>make dev-api</code>
        </section>
      )}

      <section>
        <h2 className="subtle mb-3 text-[11px] uppercase tracking-[0.18em]">
          state
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <StateCell label="queued" value={counts.queued} active={counts.queued > 0} />
          <StateCell
            label="processing"
            value={counts.processing}
            active={counts.processing > 0}
          />
          <StateCell label="ready" value={counts.ready} />
          <StateCell label="failed" value={counts.failed} danger={counts.failed > 0} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="subtle text-[11px] uppercase tracking-[0.18em]">
            sources
          </h2>
          {hasInFlight && (
            <span className="subtle text-[11px]">· live</span>
          )}
        </div>

        {sources.length === 0 ? (
          <p className="subtle text-sm">
            no sources yet ·{" "}
            <a href="/upload" className="accent">
              add one
            </a>
          </p>
        ) : (
          <ul className="space-y-px">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 border-b py-3 text-sm"
                style={{ borderColor: "var(--sn-border-subtle)" }}
              >
                <a
                  href={`/sources/${s.id}`}
                  className="min-w-0 flex-1 truncate hover:opacity-80"
                >
                  <span>{s.name}</span>
                  <span className="subtle ml-2 text-xs">
                    {s.type} · {s.id.slice(0, 7)}
                  </span>
                </a>
                <StatusBadge status={s.status} progress={s.progress} />
                <DeleteSourceButton id={s.id} name={s.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StateCell({
  label,
  value,
  active,
  danger,
}: {
  label: string;
  value: number;
  active?: boolean;
  danger?: boolean;
}) {
  const color = danger
    ? "var(--sn-danger)"
    : active
      ? "var(--sn-accent)"
      : "var(--sn-fg)";
  return (
    <div className="border py-3 px-3" style={{ borderColor: "var(--sn-border-subtle)" }}>
      <div className="subtle text-[10px] uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 text-xl" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
