"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import {
  api,
  hostedSourceLimit,
  type SystemInfo,
  type Workspace,
} from "@/lib/api";

export function BillingSection({
  workspace,
  system,
}: {
  workspace: Workspace;
  system: SystemInfo;
}) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [sourceCount, setSourceCount] = useState<number | null>(null);
  const hosted = system.mode === "hosted";
  const sourceLimit = hostedSourceLimit(workspace, system);
  const paid =
    workspace.plan === "starter" &&
    (workspace.billingStatus === "active" ||
      workspace.billingStatus === "trialing");

  const openCheckout = async () => {
    setLoading("checkout");
    try {
      const { url } = await api.createBillingCheckout();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "checkout failed");
      setLoading(null);
    }
  };

  const openPortal = async () => {
    setLoading("portal");
    try {
      const { url } = await api.createBillingPortal();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "billing portal failed");
      setLoading(null);
    }
  };

  useEffect(() => {
    api
      .listSources()
      .then((res) => setSourceCount(res.sources.length))
      .catch(() => setSourceCount(null));
  }, []);

  if (!hosted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">self-host</p>
          <Badge>AGPL-3.0</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Billing is disabled because this instance runs on your own
          infrastructure.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {workspace.plan === "starter" ? "Starter" : "Free"}
            </p>
            <Badge variant={paid ? "success" : "default"}>
              {workspace.billingStatus === "none"
                ? "free"
                : workspace.billingStatus}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {paid
              ? "Production quota is active for this workspace."
              : "Upgrade when traffic grows beyond the free hosted quota."}
          </p>
          {workspace.currentPeriodEnd && (
            <p className="text-[11px] text-muted-foreground">
              Current period ends{" "}
              {new Date(workspace.currentPeriodEnd).toLocaleDateString()}.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Sources: {sourceCount ?? "—"}
            {sourceLimit === null ? "" : ` / ${sourceLimit}`}
          </p>
        </div>

        {paid ? (
          <Button
            type="button"
            variant="outline"
            onClick={openPortal}
            disabled={loading !== null || !workspace.stripeCustomerId}
          >
            {loading === "portal" ? "opening…" : "manage billing"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={openCheckout}
            disabled={loading !== null || !system.billingConfigured}
          >
            {loading === "checkout" ? "opening…" : "upgrade"}
          </Button>
        )}
      </div>

      {!system.billingConfigured && (
        <p className="text-[11px] text-muted-foreground">
          Stripe is not configured yet. Add the Stripe environment variables to
          enable self-serve upgrades.
        </p>
      )}
    </div>
  );
}
