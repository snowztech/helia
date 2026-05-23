"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type Usage, type Workspace } from "@/lib/api";

export function LimitsSection({
  workspace,
  onWorkspace,
}: {
  workspace: Workspace;
  onWorkspace: (ws: Workspace) => void;
}) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [editing, setEditing] = useState(false);
  const [quotaDraft, setQuotaDraft] = useState<string>(
    workspace.tokenQuotaMonthly.toLocaleString(),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getUsage()
      .then(setUsage)
      .catch((err: Error) => toast.error(err.message ?? "usage load failed"));
  }, []);

  useEffect(() => {
    setQuotaDraft(workspace.tokenQuotaMonthly.toLocaleString());
  }, [workspace.tokenQuotaMonthly]);

  const used = usage?.tokensUsedMonth ?? 0;
  const quota = workspace.tokenQuotaMonthly;
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const overHalf = pct >= 50;
  const overEighty = pct >= 80;

  const saveQuota = async () => {
    const parsed = Number(quotaDraft.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 10_000) {
      toast.error("Quota must be at least 10,000");
      return;
    }
    if (parsed === workspace.tokenQuotaMonthly) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { workspace: next } = await api.patchWorkspace({
        tokenQuotaMonthly: parsed,
      });
      onWorkspace(next);
      toast.success("quota updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <Label className="text-xs">tokens this month</Label>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span>
            <span className="text-foreground">{used.toLocaleString()}</span>
            <span className="text-muted-foreground"> / </span>
            {editing ? (
              <Input
                inputMode="numeric"
                value={quotaDraft}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, "");
                  setQuotaDraft(
                    cleaned ? Number(cleaned).toLocaleString() : "",
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveQuota();
                  if (e.key === "Escape") {
                    setQuotaDraft(
                      workspace.tokenQuotaMonthly.toLocaleString(),
                    );
                    setEditing(false);
                  }
                }}
                className="inline-block h-6 w-28 py-0 text-right text-xs"
                autoFocus
              />
            ) : (
              <span className="text-muted-foreground">
                {quota.toLocaleString()}
              </span>
            )}
          </span>
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveQuota}
                disabled={saving}
                className="text-foreground hover:text-muted-foreground disabled:opacity-50"
              >
                {saving ? "saving…" : "save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuotaDraft(workspace.tokenQuotaMonthly.toLocaleString());
                  setEditing(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              edit
            </button>
          )}
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
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

      {usage && (
        <p className="text-[11px] text-muted-foreground">
          Resets {new Date(usage.monthResetsAt).toLocaleDateString()}. Rate
          limited at 30 req/min per IP.
        </p>
      )}
    </div>
  );
}
