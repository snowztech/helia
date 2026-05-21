"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Props {
  hasSources: boolean;
}

interface StepState {
  hasContent: boolean; // sources or tools
  brandCustomized: boolean;
}

const DEFAULT_PRIMARY = "#0ea5e9";
const DEFAULT_BOT_NAME = "Assistant";

export function GettingStarted({ hasSources }: Props) {
  const [state, setState] = useState<StepState>({
    hasContent: hasSources,
    brandCustomized: false,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    api
      .getWorkspace()
      .then(({ workspace }) => {
        setState((s) => ({
          ...s,
          brandCustomized:
            workspace.brandPrimary !== DEFAULT_PRIMARY ||
            workspace.botName !== DEFAULT_BOT_NAME,
        }));
      })
      .catch(() => {
        // silent — getting started is a hint, not load-blocking
      });
  }, [dismissed]);

  const steps = [
    {
      done: state.hasContent,
      label: "Add knowledge or tools",
      href: "/upload",
      hint: "Upload a PDF, paste text, crawl a URL, or plug in an HTTP tool.",
    },
    {
      done: state.brandCustomized,
      label: "Brand your widget",
      href: "/widget",
      hint: "Name your bot and pick a color.",
    },
    {
      done: false,
      label: "Install on your site",
      href: "/widget",
      hint: "Copy one script tag.",
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
              <Link
                href={s.href}
                className={cn(
                  "flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                  s.done && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    s.done
                      ? "border-success bg-success/15 text-success"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {s.done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <div className="flex-1">
                  <div className={s.done ? "line-through" : ""}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.hint}</div>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
