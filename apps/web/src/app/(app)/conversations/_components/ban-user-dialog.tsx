"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserBlock01Icon } from "@hugeicons/core-free-icons";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";

export function BanUserDialog({
  userId,
  userName,
  onBanned,
}: {
  userId: string;
  userName: string | null;
  onBanned?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [alreadyBanned, setAlreadyBanned] = useState(false);

  // Check ban status when the dialog opens so the button label and
  // confirm copy reflect the real state.
  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setReason("");
    api
      .listBans()
      .then((r) => setAlreadyBanned(r.bans.some((b) => b.userId === userId)))
      .catch(() => undefined);
  }, [open, userId]);

  const submit = async () => {
    setBusy(true);
    try {
      if (alreadyBanned) {
        await api.unbanUser(userId);
        toast.success(`Unbanned ${userName ?? userId}`);
      } else {
        await api.banUser({ userId, reason: reason.trim() || null });
        toast.success(`Banned ${userName ?? userId}`);
      }
      setOpen(false);
      onBanned?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Ban or unban this user">
          <HugeiconsIcon icon={UserBlock01Icon} size={14} />
          {alreadyBanned ? "unban" : "ban"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alreadyBanned
              ? `Unban ${userName ?? userId}?`
              : `Ban ${userName ?? userId}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {alreadyBanned
              ? "Future messages from this user will be answered by the agent again."
              : "Future messages will get a canned refusal. The agent won't be called and no tokens are spent. You can unban any time."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!alreadyBanned && (
          <div className="space-y-1.5">
            <Label htmlFor="ban-reason" className="text-xs">
              Reason (optional, for your records)
            </Label>
            <Input
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="abusive language, spam, ..."
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void submit();
            }}
            disabled={busy}
            className={
              alreadyBanned
                ? ""
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {busy
              ? "saving…"
              : alreadyBanned
                ? "Unban"
                : "Ban"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
