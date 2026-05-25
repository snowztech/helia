import { HeliaMark } from "./logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-24 pb-28 md:pt-32">
      <div className="grid items-center gap-14 md:grid-cols-[1.05fr_1fr]">
        <div className="space-y-7 reveal">
          <h1 className="text-4xl leading-[1.05] tracking-tight md:text-5xl">
            an ai assistant
            <br />
            your customers
            <br />
            can chat with.
          </h1>

          <p className="max-w-md text-base leading-relaxed text-muted">
            Connect your sources, plug in your tools, paste one snippet. Helia
            answers from your data, you keep the conversations.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-2 rounded-lg bg-fg px-5 py-3 text-sm font-medium text-bg transition-transform duration-150 hover:-translate-y-px"
            >
              start free
              <span aria-hidden>→</span>
            </a>
            <a
              href="https://github.com/snowztech/helia"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-muted-bg"
            >
              <GithubIcon />
              view on github
            </a>
          </div>
        </div>

        <HeroMock />
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="relative reveal">
      <div className="rounded-xl border border-line bg-card shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f56b6b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5c14f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5fc28f]" />
          <span className="ml-2 text-[11px] text-muted">acme.co/help</span>
        </div>
        <div className="space-y-2.5 p-6">
          <div className="text-[15px] font-semibold">Help & FAQ</div>
          <div className="h-2 w-11/12 rounded bg-muted-bg" />
          <div className="h-2 w-9/12 rounded bg-muted-bg" />
          <div className="h-2 w-10/12 rounded bg-muted-bg" />
          <div className="h-2 w-7/12 rounded bg-muted-bg" />
        </div>
      </div>

      <div className="absolute right-4 bottom-4 w-[270px] overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-line">
        <div className="flex items-center gap-2.5 bg-primary px-3.5 py-3 text-primary-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <HeliaMark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-tight">
              ask acme
            </div>
            <div className="text-[10px] opacity-80">ask me anything.</div>
          </div>
        </div>
        <div className="space-y-2 px-3 py-3 text-[12px]">
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted-bg px-3 py-2 text-fg">
            hi, how can i help?
          </div>
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-fg">
            how do i cancel my plan?
          </div>
          <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted-bg px-3 py-2 text-fg">
            you can cancel anytime from settings. want me to walk you through?
          </div>
        </div>
        <div className="border-t border-line px-3 py-2 text-[11px] text-muted">
          ask a question…
        </div>
      </div>

      <div className="glow-primary absolute -bottom-3 -left-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg">
        <HeliaMark className="h-5 w-5" />
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.78-.25.78-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.5 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
