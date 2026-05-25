import { HeliaWordmark } from "./logo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";
const VERSION = process.env.NEXT_PUBLIC_HELIA_VERSION ?? "dev";

const LINKS = [
  { label: "pricing", href: "/#pricing" },
  { label: "github", href: "https://github.com/snowztech/helia" },
  { label: "self-host", href: "https://github.com/snowztech/helia/blob/main/DEPLOY.md" },
  { label: "privacy", href: "/privacy" },
  { label: "terms", href: "/terms" },
  { label: "contact", href: "mailto:gethelia@protonmail.com" },
];

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <HeliaWordmark />
          <span className="text-[11px] tracking-widest text-muted">
            v{VERSION} · agpl
          </span>
        </div>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={`${APP_URL}/signup`}
              className="transition-colors hover:text-fg"
            >
              sign up
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
