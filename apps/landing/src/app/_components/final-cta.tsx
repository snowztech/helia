const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] p-14 text-center text-[#f7f7f5] reveal md:p-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(42,100,214,0.4),transparent_55%)]"
        />
        <div className="relative space-y-6">
          <h2 className="text-3xl md:text-5xl">
            put an ai assistant on your site.
            <br />
            today.
          </h2>
          <p className="mx-auto max-w-md text-[14px] leading-relaxed text-white/65">
            Start free. Connect a source. Paste a snippet. Your visitors get
            answers.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[13px] font-medium text-[#0a0a0a] transition-transform duration-150 hover:-translate-y-px"
            >
              start free
              <span aria-hidden>→</span>
            </a>
            <a
              href="mailto:hello@gethelia.dev"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              book a 15-min demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
