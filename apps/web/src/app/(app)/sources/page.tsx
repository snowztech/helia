import Link from "next/link";
import { api } from "@/lib/api";
import { AutoRefresh } from "../_components/auto-refresh";
import { StatusBadge } from "../_components/status-badge";
import { DeleteSourceButton } from "../_components/delete-source-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  let sources: Awaited<ReturnType<typeof api.listSources>>["sources"] = [];
  let apiError: string | null = null;
  try {
    const res = await api.listSources();
    sources = res.sources;
  } catch (err) {
    apiError = String(err);
  }

  const hasInFlight = sources.some(
    (s) => s.status === "queued" || s.status === "processing",
  );

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={hasInFlight} intervalMs={2000} />

      <header className="sticky top-0 z-20 -mx-4 flex items-end justify-between sm:-mx-6 gap-4 border-b border-border-subtle bg-background px-4 py-3 sm:px-6">
        <div className="space-y-1">
          <h1 className="text-2xl">sources.</h1>
          <p className="text-xs text-muted-foreground">
            Docs, web pages, and text the agent can search.
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">+ add source</Link>
        </Button>
      </header>

      {apiError && (
        <Card>
          <CardContent className="py-4 text-sm">
            <span className="text-destructive">API unreachable</span>{" "}
            <span className="text-muted-foreground">— run</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">make dev-api</code>
          </CardContent>
        </Card>
      )}

      {sources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
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
    </div>
  );
}
