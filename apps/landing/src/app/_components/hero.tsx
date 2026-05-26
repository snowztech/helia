import { HeroChat } from "./hero-chat";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-14 pb-20 md:pt-32 md:pb-28">
      <div className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
        <div className="space-y-7 reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-[11px] tracking-widest text-muted uppercase">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden
            />
            open source · self-hostable
          </span>

          <h1 className="text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            an ai assistant
            <br />
            your customers
            <br />
            can <span className="text-primary">chat</span> with.
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

        <HeroChat />
      </div>
    </section>
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
