import type { Metadata } from "next";
import "@snowztech/ui/styles.css";
import "./globals.css";
import { ThemeToggle } from "@snowztech/ui/client";

export const metadata: Metadata = {
  title: "Helia",
  description: "Turn your docs into an AI support agent.",
};

// Inline FOUC guard: applies the persisted theme before React hydrates, so
// the page paints in the right palette on first paint. Matches the
// `data-theme` convention used by @snowztech/ui's ThemeToggle.
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
        <div className="mx-auto max-w-3xl px-6 py-10">
          <header className="mb-12 flex items-center justify-between">
            <a href="/" className="accent text-sm font-medium">
              helia
            </a>
            <nav className="flex items-center gap-5 text-sm">
              <a href="/upload" className="muted hover:opacity-80">
                upload
              </a>
              <a href="/chat" className="muted hover:opacity-80">
                chat
              </a>
              <ThemeToggle size={16} defaultTheme="dark" storageKey="theme" />
            </nav>
          </header>
          {children}
          <footer className="subtle mt-20 text-xs">
            v0.0.1 · open source ·{" "}
            <a
              href="https://github.com/snowztech/helia"
              target="_blank"
              rel="noreferrer"
              className="accent"
            >
              github
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
