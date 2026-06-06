"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

type State =
  | { kind: "loading" }
  | { kind: "fallback"; message: string }
  | { kind: "error"; message: string };

export default function StarterCheckoutPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      try {
        const [{ workspace }, system] = await Promise.all([
          api.getWorkspace(),
          api.getSystem(),
        ]);

        const activeStarter =
          workspace.plan === "starter" &&
          (workspace.billingStatus === "active" ||
            workspace.billingStatus === "trialing");
        if (activeStarter) {
          router.replace("/settings#billing");
          return;
        }

        if (!system.billingConfigured) {
          if (!cancelled) {
            setState({
              kind: "fallback",
              message:
                "Billing is not configured yet. Email us to upgrade to Starter.",
            });
          }
          return;
        }

        const { url } = await api.createBillingCheckout();
        window.location.href = url;
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "checkout failed",
          });
        }
      }
    }

    void startCheckout();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl">starter checkout.</h1>
        <p className="text-sm text-muted-foreground">
          Redirecting you to Stripe Checkout.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-5 text-sm">
          {state.kind === "loading" ? (
            <p className="text-muted-foreground">Opening secure checkout...</p>
          ) : (
            <>
              <p>{state.message}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href="mailto:gethelia@protonmail.com?subject=Helia%20Starter">
                    email us
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/settings#billing">billing settings</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
