import Link from "next/link";
import { api } from "@/lib/api";
import { AutoRefresh } from "./_components/auto-refresh";
import { StatusBadge } from "./_components/status-badge";
import { DeleteSourceButton } from "./_components/delete-source-button";
import { GettingStarted } from "./_components/getting-started";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-10">
      <AutoRefresh enabled={hasInFlight} intervalMs={2000} />

      <section className="space-y-2">
        <h1 className="text-2xl">
          your own <span className="text-primary">ai assistant</span>.
        </h1>
        <p className="text-sm text-muted-foreground">
          Docs, APIs, one script tag.
        </p>
      </section>

      <GettingStarted hasSources={sources.length > 0} />

      {apiError && (
        <Card>
          <CardContent className="py-4 text-sm">
            <span className="text-destructive">API unreachable</span>{" "}
            <span className="text-muted-foreground">— run</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">make dev-api</code>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            sources
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/upload">+ add source</Link>
          </Button>
        </div>

        {sources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">No sources yet.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/upload">+ add source</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <a
                  href={`/sources/${s.id}`}
                  className="min-w-0 flex-1 truncate hover:opacity-80"
                >
                  <span>{s.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
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
