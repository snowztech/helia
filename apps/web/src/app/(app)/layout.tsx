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
import { MobileMenu } from "./_components/mobile-menu";

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
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-8 flex items-center justify-between gap-3 sm:mb-10 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <a href="/" aria-label="Helia home">
              <HeliaWordmark />
            </a>
            <WorkspaceChip />
          </div>

          {/* Desktop nav cluster */}
          <div className="hidden items-center gap-2 md:flex">
            <Nav />
            <Button asChild variant="ghost" size="icon" aria-label="Settings">
              <Link href="/settings">
                <HugeiconsIcon icon={Settings02Icon} size={16} />
              </Link>
            </Button>
            <ThemeToggle />
            <LogoutButton />
          </div>

          {/* Mobile: keep theme + logout visible, fold nav into a menu */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <LogoutButton />
            <MobileMenu />
          </div>
        </header>

        {children}

        <footer className="mt-16 flex items-center justify-between border-t border-border-subtle pt-4 text-xs text-muted-foreground sm:mt-20">
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
