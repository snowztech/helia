import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeliaWordmark } from "@/components/helia-wordmark";
import { api, ApiError } from "@/lib/api";
import { Nav } from "./_components/nav";
import { WorkspaceChip } from "./_components/workspace-chip";
import { WorkspaceProvider } from "./_components/workspace-provider";
import { LogoutButton } from "./_components/logout-button";

const VERSION = process.env.NEXT_PUBLIC_HELIA_VERSION ?? "dev";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const me = await api.me();
    if (!me.user) redirect("/login");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login");
    throw err;
  }

  return (
    <WorkspaceProvider>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" aria-label="Helia home">
              <HeliaWordmark />
            </a>
            <WorkspaceChip />
          </div>
          <div className="flex items-center gap-2">
            <Nav />
            <Button asChild variant="ghost" size="icon" aria-label="Settings">
              <Link href="/settings">
                <HugeiconsIcon icon={Settings02Icon} size={16} />
              </Link>
            </Button>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        {children}
        <footer className="mt-20 flex items-center justify-between border-t border-border-subtle pt-4 text-xs text-muted-foreground">
          <span>v{VERSION} · open source</span>
          <a
            href="https://github.com/snowztech/helia"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            github ↗
          </a>
        </footer>
      </div>
    </WorkspaceProvider>
  );
}
