"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { api, type BannedUser } from "@/lib/api";

export function BansSection() {
  const [bans, setBans] = useState<BannedUser[] | null>(null);
  const [unbanning, setUnbanning] = useState<string | null>(null);

  useEffect(() => {
    api
      .listBans()
      .then((r) => setBans(r.bans))
      .catch((err: Error) => toast.error(err.message ?? "load failed"));
  }, []);

  if (!bans) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (bans.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No banned users. Use the ban button on a conversation to block a
        signed end-user from the agent.
      </p>
    );
  }

  const unban = async (userId: string) => {
    setUnbanning(userId);
    try {
      await api.unbanUser(userId);
      setBans((prev) => prev?.filter((b) => b.userId !== userId) ?? null);
      toast.success("Unbanned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unban failed");
    } finally {
      setUnbanning(null);
    }
  };

  return (
    <ul className="divide-y divide-border-subtle">
      {bans.map((b) => (
        <li
          key={b.userId}
          className="flex items-center gap-3 py-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <code className="text-xs">{b.userId}</code>
            {b.reason && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {b.reason}
              </p>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {new Date(b.bannedAt).toLocaleDateString()}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void unban(b.userId)}
            disabled={unbanning === b.userId}
          >
            {unbanning === b.userId ? "unbanning…" : "unban"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
