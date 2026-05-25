import { HeliaMark } from "./logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="space-y-7">
          <span className="eyebrow">open source · self-hostable</span>

          <h1 className="text-5xl leading-[1.05] md:text-6xl">
            An AI assistant your customers
            <br />
            can actually chat with.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Helia turns your docs, website, and business data into an AI
            assistant. Drop one snippet on your site. Your customers get
            answers, you keep the conversations.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-cream transition-opacity hover:opacity-90"
            >
              start free
              <span aria-hidden>→</span>
            </a>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-cream/60 px-5 py-3 text-sm font-medium text-ink hover:bg-cream-soft"
            >
              see a live demo
            </a>
          </div>

          <div className="flex items-center gap-3 pt-2 text-sm text-muted">
            <div className="flex -space-x-1.5">
              <span className="h-5 w-5 rounded-full border-2 border-cream bg-indigo" />
              <span className="h-5 w-5 rounded-full border-2 border-cream bg-indigo-soft" />
              <span className="h-5 w-5 rounded-full border-2 border-cream bg-ink" />
              <span className="h-5 w-5 rounded-full border-2 border-cream bg-[#d4733b]" />
            </div>
            <span>
              Trusted by early teams ·{" "}
              <a className="text-ink hover:underline" href="#">
                read stories
              </a>
            </span>
          </div>
        </div>

        <HeroMock />
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="relative rounded-2xl border border-line bg-cream-soft/80 p-6 shadow-[0_20px_60px_-30px_rgba(10,10,10,0.25)]">
      {/* Fake browser */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-line/80">
        <div className="flex items-center gap-2 border-b border-line/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f56b6b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5c14f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5fc28f]" />
          <span className="ml-3 font-mono text-[11px] text-muted">acme.co</span>
        </div>
        <div className="space-y-2.5 p-5">
          <div className="text-sm font-semibold text-ink">Acme Co. · Help</div>
          <div className="h-2 rounded bg-line/80" />
          <div className="h-2 w-11/12 rounded bg-line/80" />
          <div className="h-2 w-10/12 rounded bg-line/80" />
          <div className="h-2 w-8/12 rounded bg-line/80" />
        </div>
      </div>

      {/* Floating widget */}
      <div className="absolute right-6 bottom-6 w-[280px] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-line">
        <div className="flex items-center justify-between bg-indigo px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <HeliaMark className="h-5 w-5 text-white" />
            <div>
              <div className="text-sm font-semibold leading-tight">
                Ask Acme
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            online
          </span>
        </div>
        <div className="space-y-2 p-3 text-[13px]">
          <div className="max-w-[80%] rounded-2xl bg-cream-soft px-3 py-2">
            Hi 👋 I&apos;m your AI assistant. Ask me anything.
          </div>
          <div className="ml-auto max-w-[85%] rounded-2xl bg-indigo px-3 py-2 text-white">
            How do I cancel my annual plan?
          </div>
          <div className="max-w-[90%] rounded-2xl bg-cream-soft px-3 py-2">
            You can request a pro-rated refund within 30 days of renewal — I
            can start that for you.
          </div>
        </div>
        <div className="border-t border-line px-3 py-2.5">
          <div className="font-mono text-[10px] text-muted">
            type your question…
          </div>
        </div>
      </div>

      {/* Launcher bubble */}
      <div className="absolute -bottom-3 -left-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-lg">
        <HeliaMark className="h-6 w-6" />
      </div>
    </div>
  );
}
