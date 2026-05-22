"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { api, type HeliaTool } from "@/lib/api";
import { ToolDialog, type ToolDraft } from "./_components/tool-dialog";

const EMPTY_DRAFT: ToolDraft = {
  name: "",
  description: "",
  url: "",
  method: "POST",
  paramsSchema: [],
  headers: {},
  timeoutMs: 10000,
  maxResponseBytes: 102400,
  enabled: true,
};

export default function ToolsPage() {
  const [tools, setTools] = useState<HeliaTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeliaTool | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HeliaTool | null>(null);

  const refresh = async () => {
    try {
      const { tools: rows } = await api.listTools();
      // newest first
      setTools(
        [...rows].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      toast.error(String(err));
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (t: HeliaTool) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const save = async (draft: ToolDraft) => {
    try {
      if (editing) {
        await api.updateTool(editing.id, draft);
        toast.success(`updated ${draft.name}`);
      } else {
        await api.createTool(draft);
        toast.success(`created ${draft.name}`);
      }
      setDialogOpen(false);
      await refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const t = pendingDelete;
    setPendingDelete(null);
    try {
      await api.deleteTool(t.id);
      toast.success(`deleted ${t.name}`);
      await refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const toggleEnabled = async (t: HeliaTool, next: boolean) => {
    // optimistic
    setTools((prev) =>
      prev.map((row) => (row.id === t.id ? { ...row, enabled: next } : row)),
    );
    try {
      await api.updateTool(t.id, { enabled: next });
    } catch (err) {
      toast.error(String(err));
      await refresh();
    }
  };

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-6 flex items-end justify-between gap-4 border-b border-border-subtle bg-background px-6 py-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl">tools.</h1>
          <p className="text-xs text-muted-foreground">
            HTTP endpoints the agent can call.
          </p>
        </div>
        <Button onClick={openCreate}>
          <HugeiconsIcon icon={PlusSignIcon} size={14} /> add tool
        </Button>
      </header>

      {loading ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-start gap-4 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </li>
          ))}
        </ul>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-sm text-muted-foreground">No tools yet.</p>
            <Button onClick={openCreate}>
              <HugeiconsIcon icon={PlusSignIcon} size={14} /> add your first tool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {tools.map((t) => (
            <li key={t.id} className="flex items-start gap-4 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm">{t.name}</code>
                  {!t.enabled && <Badge>disabled</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.description}
                </p>
                <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span className="rounded border border-border px-1.5 py-0.5 text-[10px]">
                    {t.method}
                  </span>
                  <span className="truncate">{t.url}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={t.enabled}
                  onCheckedChange={(v) => toggleEnabled(t, v)}
                  aria-label={`${t.enabled ? "disable" : "enable"} ${t.name}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(t)}
                  aria-label="Edit"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete(t)}
                  aria-label="Delete"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ToolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                url: editing.url,
                method: editing.method,
                paramsSchema: editing.paramsSchema,
                headers: editing.headers,
                timeoutMs: editing.timeoutMs,
                maxResponseBytes: editing.maxResponseBytes,
                enabled: editing.enabled,
              }
            : EMPTY_DRAFT
        }
        isEdit={!!editing}
        onSave={save}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{pendingDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The agent will no longer be able to call this tool. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
