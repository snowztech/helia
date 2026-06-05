import Link from "next/link";
import { HeliaWordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

const NAV_LINKS = [
  { label: "features", href: "/#features" },
  { label: "pricing", href: "/#pricing" },
  { label: "docs", href: "/docs" },
  { label: "github", href: "https://github.com/snowztech/helia" },
];

function isExternalHref(href: string) {
  return href.startsWith("http");
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="Helia home">
          <HeliaWordmark />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-5 text-[13px] text-muted md:flex"
        >
          {NAV_LINKS.map((link) => (
            isExternalHref(link.href) ? (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-fg"
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            href="/docs"
            className="text-[13px] text-muted transition-colors hover:text-fg md:hidden"
          >
            docs
          </Link>
          <a
            href={`${APP_URL}/login`}
            className="hidden text-[13px] text-muted transition-colors hover:text-fg sm:block"
          >
            sign in
          </a>
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2 text-[13px] font-medium text-bg transition-transform duration-150 hover:-translate-y-px hover:opacity-95"
          >
            start free
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
