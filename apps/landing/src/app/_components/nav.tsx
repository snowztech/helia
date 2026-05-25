import Link from "next/link";
import { HeliaWordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Helia home">
          <HeliaWordmark />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
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
