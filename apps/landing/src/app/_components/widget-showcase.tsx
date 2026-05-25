import { HeliaMark } from "./logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

const BULLETS = [
  "Bring your own brand colour and copy",
  "Floating bubble or inline embed",
  "Light, dark, or follow-system",
  "Citations on every answer",
];

export function WidgetShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="overflow-hidden rounded-3xl bg-ink text-cream">
        <div className="grid gap-12 p-10 md:grid-cols-2 md:gap-8 md:p-14">
          <div className="space-y-7">
            <span className="eyebrow !text-cream/60">the widget</span>
            <h2 className="text-4xl text-cream md:text-5xl">
              Floating or inline.
              <br />
              Always on brand.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-cream/70">
              The widget reads your brand colour, copy, and suggestions, and
              adapts to light or dark. Embed it as a chat bubble, or drop it
              inline on your /help page.
            </p>
            <ul className="space-y-2.5 text-cream/85">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`${APP_URL}/signup`}
                className="inline-flex items-center gap-2 rounded-lg bg-cream px-5 py-3 text-sm font-medium text-ink hover:bg-white"
              >
                try the widget
                <span aria-hidden>→</span>
              </a>
              <a
                href="#product"
                className="inline-flex items-center gap-2 rounded-lg border border-cream/30 px-5 py-3 text-sm font-medium text-cream hover:bg-cream/10"
              >
                view configurator
              </a>
            </div>
          </div>

          <ShowcaseMock />
        </div>
      </div>
    </section>
  );
}

function ShowcaseMock() {
  return (
    <div className="relative">
      <div className="rounded-xl bg-white text-ink shadow-2xl ring-1 ring-black/20">
        <div className="flex items-center gap-2 border-b border-line/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f56b6b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5c14f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5fc28f]" />
          <span className="ml-3 font-mono text-[11px] text-muted">
            acme.co/help
          </span>
        </div>
        <div className="space-y-3 p-5">
          <h4 className="text-base font-semibold">Help & FAQ</h4>
          <p className="text-sm text-muted">
            Ask our assistant anything. Answers come straight from our docs.
          </p>

          <div className="rounded-lg bg-indigo px-3 py-2.5 text-sm text-white">
            Hi 👋 I&apos;m here to help.
          </div>
          {[
            "What are your refund terms?",
            "Can I export all my data?",
            "Do you support SSO?",
          ].map((q) => (
            <div
              key={q}
              className="rounded-lg bg-cream-soft px-3 py-2.5 text-sm"
            >
              {q}
            </div>
          ))}
          <div className="rounded-lg border border-line bg-white px-3 py-2.5 font-mono text-[11px] text-muted">
            type your question…
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -bottom-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-[0_0_60px_15px_rgba(58,85,224,0.4)]">
        <HeliaMark className="h-6 w-6" />
      </div>
    </div>
  );
}
