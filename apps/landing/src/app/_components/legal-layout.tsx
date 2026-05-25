import Link from "next/link";
import { HeliaWordmark } from "./logo";
import { Footer } from "./footer";
import { ThemeToggle } from "./theme-toggle";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Helia home">
            <HeliaWordmark />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
          >
            <span aria-hidden>←</span> back
          </Link>
          <h1 className="text-3xl tracking-tight md:text-4xl">{title}</h1>
          <p className="text-xs text-muted">Last updated · {updated}</p>
        </div>

        <article className="legal mt-10 space-y-7 text-sm leading-relaxed text-fg/85">
          {children}
        </article>
      </main>

      <Footer />
    </>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-fg">{heading}</h2>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}
