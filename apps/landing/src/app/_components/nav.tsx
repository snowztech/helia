import Link from "next/link";
import { HeliaWordmark } from "./logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Helia home">
          <HeliaWordmark />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#product" className="hover:text-ink">
            product
          </a>
          <a href="#how" className="hover:text-ink">
            how it works
          </a>
          <a href="#pricing" className="hover:text-ink">
            pricing
          </a>
          <a href="https://github.com/snowztech/helia" className="hover:text-ink">
            docs
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={`${APP_URL}/login`}
            className="hidden text-sm text-muted hover:text-ink sm:block"
          >
            sign in
          </a>
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90"
          >
            start free
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
