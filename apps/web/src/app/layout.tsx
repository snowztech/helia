import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Nav } from "./_components/nav";
import { WorkspaceChip } from "./_components/workspace-chip";
import { WorkspaceProvider } from "./_components/workspace-provider";

export const metadata: Metadata = {
  title: "Helia",
  description:
    "Your own AI assistant. Upload your docs, plug in your APIs, drop one script tag.",
};

const VERSION = "0.0.1";

// Inline FOUC guard: applies the persisted theme before React hydrates,
// so the page paints in the right palette on first paint.
const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <WorkspaceProvider>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a href="/" className="text-sm font-semibold text-primary">
                helia
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
        <Toaster />
      </body>
    </html>
  );
}
