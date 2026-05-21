import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Nav } from "./_components/nav";

export const metadata: Metadata = {
  title: "Helia",
  description: "Your own AI assistant. Upload your docs, plug in your APIs, drop one script tag.",
};

// Inline FOUC guard: applies the persisted theme before React hydrates,
// so the page paints in the right palette on first paint.
const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-10 flex items-center justify-between">
            <a href="/" className="text-sm font-semibold text-primary">
              helia
            </a>
            <div className="flex items-center gap-2">
              <Nav />
              <ThemeToggle />
            </div>
          </header>
          {children}
          <footer className="mt-20 text-xs text-muted-foreground">
            v0.0.1 · open source ·{" "}
            <a
              href="https://github.com/snowztech/helia"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              github
            </a>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
