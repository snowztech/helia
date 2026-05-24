"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { PasswordInput } from "../_components/password-input";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
    >
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-xl font-semibold">Reset link missing</h1>
        <p className="text-sm text-muted-foreground">
          Use the full link from your email.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot">Request a new link</Link>
        </Button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword({ token: token!, password });
      toast.success("Password updated. Sign in with the new one.");
      router.replace("/login");
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 400
          ? "Link expired or already used. Request a new one."
          : err instanceof Error
            ? err.message
            : "Reset failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          You'll be signed out everywhere and asked to log in again.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
