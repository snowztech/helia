"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  BubbleChatIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { api, type ConversationSummary } from "@/lib/api";

export default function ConversationsPage() {
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [clearing, setClearing] = useState(false);

  const refresh = (filter = errorsOnly) => {
    setLoading(true);
    api
      .listConversations({ limit: 100, errors: filter })
      .then((r) => setRows(r.conversations))
      .catch((err: Error) => toast.error(err.message ?? "load failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh(errorsOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorsOnly]);

  const clearAll = async () => {
    setClearing(true);
    try {
      const res = await api.deleteAllConversations();
      toast.success(`Deleted ${res.deleted} turn${res.deleted === 1 ? "" : "s"}`);
      setRows([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "delete failed");
    } finally {
      setClearing(false);
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-6 flex items-end justify-between gap-4 border-b border-border-subtle bg-background px-6 py-3">
        <div className="space-y-1">
          <h1 className="text-2xl">conversations.</h1>
          <p className="text-xs text-muted-foreground">
            Every chat your widget has handled. Click a row to see the full
            transcript.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            errors only
            <Switch checked={errorsOnly} onCheckedChange={setErrorsOnly} />
          </label>
          {rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={clearing}>
                  clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Every turn for this workspace will be removed. The widget
                    keeps working, but its history is gone for good.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void clearAll();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Empty errorsOnly={errorsOnly} />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {rows.map((r) => (
            <li key={r.id} className="group relative">
              <Link
                href={`/conversations/${r.id}`}
                className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <HugeiconsIcon
                    icon={r.hasError ? Alert02Icon : BubbleChatIcon}
                    size={12}
                  />
                </span>
                {r.userName && (
                  <span className="flex-shrink-0 text-[11px] font-medium text-muted-foreground">
                    {r.userName}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">
                  {r.lastUserMessage}
                </span>
                {r.hasError && <Badge variant="destructive">error</Badge>}
                <Badge variant="outline">
                  {r.turns} {r.turns === 1 ? "turn" : "turns"}
                </Badge>
                <span className="w-12 flex-shrink-0 text-right text-[11px] text-muted-foreground group-hover:invisible">
                  {timeAgo(r.lastActiveAt)}
                </span>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void deleteOne(r.id);
                }}
                className="absolute right-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:flex"
                aria-label="Delete conversation"
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && rows.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Showing {rows.length} most recent{errorsOnly ? " with errors" : ""}.
        </p>
      )}
    </div>
  );
}

function Empty({ errorsOnly }: { errorsOnly: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card px-6 py-12 text-center">
      <p className="text-sm font-medium">
        {errorsOnly ? "No errors yet." : "No conversations yet."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {errorsOnly
          ? "Nothing has failed."
          : "Once your widget is live, every chat shows up here."}
      </p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
