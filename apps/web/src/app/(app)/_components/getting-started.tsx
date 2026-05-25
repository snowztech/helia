"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface StepState {
  hasSources: boolean;
  hasTools: boolean;
  brandCustomized: boolean;
  hasMessages: boolean;
}

const DEFAULT_PRIMARY = "#3a55e0";
const DEFAULT_BOT_NAME = "Assistant";

/**
 * `hasSources` is an optional hint for pages that already know it (e.g.
 * /sources). The component still self-fetches everything else.
 */
export function GettingStarted({ hasSources }: { hasSources?: boolean }) {
  const [state, setState] = useState<StepState>({
    hasSources: hasSources ?? false,
    hasTools: false,
    brandCustomized: false,
    hasMessages: false,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    Promise.all([
      api.getWorkspace(),
      api.listTools(),
      api.listSources().catch(() => ({ sources: [] })),
      api.getMetrics().catch(() => null),
    ])
      .then(([{ workspace }, { tools }, { sources }, metrics]) => {
        setState({
          hasSources: sources.length > 0,
          hasTools: tools.length > 0,
          brandCustomized:
            workspace.brandPrimary !== DEFAULT_PRIMARY ||
            workspace.botName !== DEFAULT_BOT_NAME,
          hasMessages: (metrics?.messagesTotal ?? 0) > 0,
        });
      })
      .catch(() => {
        // hint, not load-blocking
      });
  }, [dismissed]);

  const knowledgeDone = state.hasSources || state.hasTools;

  const steps = [
    {
      done: knowledgeDone,
      label: "Give your assistant something to answer with",
      hint: state.hasSources
        ? "Docs added. You can also plug in your APIs as tools."
        : state.hasTools
          ? "Tools connected. You can also upload docs."
          : "Upload PDFs or paste text · or plug in your APIs.",
      paths: state.hasSources
        ? [{ label: "add tool", href: "/tools" }]
        : state.hasTools
          ? [{ label: "add source", href: "/upload" }]
          : [
              { label: "add source", href: "/upload" },
              { label: "add tool", href: "/tools" },
            ],
    },
    {
      done: state.brandCustomized,
      label: "Brand your widget",
      hint: "Name your bot and pick a color.",
      paths: [{ label: "customize", href: "/widget" }],
    },
    {
      done: state.hasMessages,
      label: "Install on your site",
      hint: state.hasMessages
        ? "We've seen real chat traffic — you're live."
        : "Copy one script tag.",
      paths: [{ label: "get snippet", href: "/widget" }],
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length || dismissed) return null;

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              getting started
            </p>
            <p className="mt-1 text-sm">
              {completed} of {steps.length} done · keep going.
            </p>
          </div>
          <button
            type="button"
            data-shadcn=""
            onClick={() => setDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            hide
          </button>
        </div>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.label}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-md border border-border px-3 py-2.5 text-sm",
                  s.done && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    s.done
                      ? "border-success bg-success/15 text-success"
                      : "border-primary/30 bg-primary/8 text-primary",
                  )}
                >
                  {s.done ? (
                    <HugeiconsIcon icon={Tick02Icon} size={12} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="flex-1 space-y-1">
                  <div className={s.done ? "line-through" : ""}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.hint}</div>
                  {!s.done && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {s.paths.map((p) => (
                        <Link
                          key={p.href + p.label}
                          href={p.href}
                          className="text-xs text-primary hover:underline"
                        >
                          {p.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
