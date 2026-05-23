"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type State = "verifying" | "success" | "error" | "missing";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
    >
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>(token ? "verifying" : "missing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await api.verifyEmail(token);
        if (!cancelled) setState("success");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Verification failed");
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-xl font-semibold">Verify your email</h1>

      {state === "verifying" && (
        <p className="text-sm text-muted-foreground">Verifying...</p>
      )}

      {state === "success" && (
        <>
          <p className="text-sm text-muted-foreground">
            Your email is verified.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-sm text-destructive">
            {error ?? "Link expired or already used."}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      )}

      {state === "missing" && (
        <p className="text-sm text-muted-foreground">
          Missing verification token. Use the link from your email.
        </p>
      )}
    </div>
  );
}
