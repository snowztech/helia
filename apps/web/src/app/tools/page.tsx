"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl">tools.</h1>
          <p className="text-xs text-muted-foreground">
            HTTP endpoints the agent can call mid-conversation. Define a tool,
            point it at your API, the assistant uses it when relevant.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> add tool
        </Button>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">loading…</p>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tools yet. Plug in your first endpoint to give the agent live
              data.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus /> add your first tool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {tools.map((t) => (
            <li key={t.id} className="flex items-start gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-sm">{t.name}</code>
                  <Badge variant="outline">{t.method}</Badge>
                  {!t.enabled && <Badge>disabled</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                  {t.url}
                </p>
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
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete(t)}
                  aria-label="Delete"
                >
                  <Trash2 />
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
