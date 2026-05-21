"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Polls the current route every `intervalMs` while `enabled` is true.
 * Used on pages that show in-flight job/source status so the user doesn't
 * have to manually refresh.
 */
export function AutoRefresh({
  enabled,
  intervalMs = 2000,
}: {
  enabled: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, router]);
  return null;
}
