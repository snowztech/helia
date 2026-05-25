const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-14 text-center text-cream md:p-20">
        {/* soft indigo glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,85,224,0.35),transparent_60%)]"
        />
        <div className="relative space-y-7">
          <h2 className="text-4xl text-cream md:text-6xl">
            Put an AI assistant on your site.
            <br />
            Today.
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-cream/70">
            Start free. Connect a source. Paste a snippet. Done. Your visitors
            get answers instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-2 rounded-lg bg-cream px-5 py-3 text-sm font-medium text-ink hover:bg-white"
            >
              start free
              <span aria-hidden>→</span>
            </a>
            <a
              href="mailto:hello@gethelia.dev"
              className="inline-flex items-center gap-2 rounded-lg border border-cream/30 px-5 py-3 text-sm font-medium text-cream hover:bg-cream/10"
            >
              book a 15-min demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
