"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import { GettingStarted } from "./_components/getting-started";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import {
  api,
  type ConversationSummary,
  type Metrics,
  type Usage,
} from "@/lib/api";

export default function HomePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMetrics(),
      api.getUsage(),
      api.listConversations({ limit: 8 }),
    ])
      .then(([m, u, c]) => {
        setMetrics(m);
        setUsage(u);
        setConversations(c.conversations);
        setApiOk(true);
      })
      .catch((err: Error) => {
        setApiOk(false);
        toast.error(err.message ?? "API unreachable");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl">overview.</h1>
        <p className="text-xs text-muted-foreground">
          How your assistant is doing.
        </p>
      </header>

      {!apiOk && (
        <Card>
          <CardContent className="py-4 text-sm">
            <span className="text-destructive">API unreachable</span>{" "}
            <span className="text-muted-foreground">— run</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">make dev-api</code>
          </CardContent>
        </Card>
      )}

      <MetricGrid loading={loading} metrics={metrics} />

      {usage && <QuotaBar usage={usage} />}

      <GettingStarted hasSources={(metrics?.conversationsTotal ?? 0) > 0} />

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            recent conversations
          </h2>
        </div>

        {loading ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </li>
            ))}
          </ul>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No messages yet.{" "}
                <Link href="/widget" className="text-primary hover:underline">
                  Install the widget
                </Link>{" "}
                or test in the live preview.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={BubbleChatIcon} size={12} />
                  </span>
                  {c.userName && (
                    <span className="flex-shrink-0 text-[11px] font-medium text-muted-foreground">
                      {c.userName}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {c.lastUserMessage}
                  </span>
                  {c.hasError && <Badge variant="destructive">error</Badge>}
                  <Badge variant="outline">
                    {c.turns} {c.turns === 1 ? "turn" : "turns"}
                  </Badge>
                  <span className="w-12 flex-shrink-0 text-right text-[11px] text-muted-foreground">
                    {timeAgo(c.lastActiveAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricGrid({
  loading,
  metrics,
}: {
  loading: boolean;
  metrics: Metrics | null;
}) {
  if (loading || !metrics) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric
        label="Conversations this month"
        value={metrics.conversationsMonth.toLocaleString()}
        hint={`${metrics.conversationsToday.toLocaleString()} today`}
      />
      <Metric
        label="Messages this month"
        value={metrics.messagesMonth.toLocaleString()}
        hint={`${metrics.messagesToday.toLocaleString()} today`}
      />
      <Metric
        label="Avg response"
        value={
          metrics.avgLatencyMs > 0
            ? `${(metrics.avgLatencyMs / 1000).toFixed(1)}s`
            : "—"
        }
        hint="this month"
      />
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl">{value}</div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

/**
 * Slim quota strip below the metric grid. Glanceable signal so the
 * customer sees they're approaching the cap before /chat starts returning
 * 402s in production. Clicking jumps to Settings → Limits.
 */
function QuotaBar({ usage }: { usage: Usage }) {
  const pct =
    usage.tokenQuotaMonthly > 0
      ? Math.min(100, (usage.tokensUsedMonth / usage.tokenQuotaMonthly) * 100)
      : 0;
  const overHalf = pct >= 50;
  const overEighty = pct >= 80;

  return (
    <Link
      href="/settings#limits"
      className="block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Tokens this month
        </span>
        <span className="font-mono text-xs">
          <span className="text-foreground">
            {usage.tokensUsedMonth.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {" "}
            / {usage.tokenQuotaMonthly.toLocaleString()}
          </span>
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            "h-full rounded-full transition-all " +
            (overEighty
              ? "bg-destructive"
              : overHalf
                ? "bg-warning"
                : "bg-primary")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
