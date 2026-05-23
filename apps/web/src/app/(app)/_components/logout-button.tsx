"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    try {
      await api.logout();
    } catch {
      // best-effort; redirect either way
    }
    router.replace("/login");
    router.refresh();
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      onClick={logout}
    >
      <HugeiconsIcon icon={Logout03Icon} size={16} />
    </Button>
  );
}
