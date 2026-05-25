import { HeliaWordmark } from "./logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";
const VERSION = process.env.NEXT_PUBLIC_HELIA_VERSION ?? "dev";

const COLUMNS = [
  {
    title: "product",
    links: [
      { label: "overview", href: "#product" },
      { label: "how it works", href: "#how" },
      { label: "pricing", href: "#pricing" },
      { label: "changelog", href: "https://github.com/snowztech/helia/releases" },
      { label: "roadmap", href: "https://github.com/snowztech/helia/blob/main/ROADMAP.md" },
    ],
  },
  {
    title: "developers",
    links: [
      { label: "docs", href: "https://github.com/snowztech/helia#readme" },
      { label: "api reference", href: "https://github.com/snowztech/helia" },
      { label: "widget sdk", href: "https://github.com/snowztech/helia/tree/main/packages/widget" },
      { label: "github", href: "https://github.com/snowztech/helia" },
      { label: "self-host", href: "https://github.com/snowztech/helia/blob/main/DEPLOY.md" },
    ],
  },
  {
    title: "company",
    links: [
      { label: "about", href: "#" },
      { label: "blog", href: "#" },
      { label: "security", href: "#" },
      { label: "privacy", href: "#" },
      { label: "contact", href: "mailto:hello@gethelia.dev" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line/60 pt-16 pb-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <HeliaWordmark />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              The open AI assistant for small businesses. Knowledge, tools, and
              a widget, no boilerplate.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`${APP_URL}/signup`}
                className="text-sm text-ink hover:underline"
              >
                start free
              </a>
              <span className="text-muted">·</span>
              <a
                href="https://github.com/snowztech/helia"
                className="text-sm text-ink hover:underline"
              >
                github
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-ink/85 hover:text-ink"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-between border-t border-line/60 pt-6 font-mono text-[11px] text-muted">
          <span>
            © {new Date().getFullYear()} helia · v{VERSION} · open source · AGPL
          </span>
          <span>made on planet earth</span>
        </div>
      </div>
    </footer>
  );
}
