const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

const TIERS = [
  {
    name: "starter",
    price: "$0",
    suffix: "forever free",
    blurb: "For tinkering and side projects. Single workspace, public widget.",
    bullets: [
      "100 messages / month",
      "10 sources, 5 pages crawl",
      "Floating widget",
      "Community support",
    ],
    cta: { label: "start free", href: `${APP_URL}/signup` },
    popular: false,
  },
  {
    name: "team",
    price: "$29",
    suffix: "/ workspace / mo",
    blurb: "For small businesses ready to take their assistant live.",
    bullets: [
      "5,000 messages / month",
      "Unlimited sources, 500-page crawl",
      "Inline embed + custom branding",
      "Tools (DB, REST, actions)",
      "Email support, 24h",
    ],
    cta: { label: "start team", href: `${APP_URL}/signup?plan=team` },
    popular: true,
  },
  {
    name: "scale",
    price: "custom",
    suffix: "",
    blurb: "For teams with serious volume, or self-hosting requirements.",
    bullets: [
      "Unlimited messages, SLA",
      "SSO, audit log, roles",
      "Self-host (open-source core)",
      "Dedicated support",
    ],
    cta: { label: "talk to us", href: "mailto:hello@gethelia.dev" },
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="space-y-4 text-center">
        <span className="eyebrow justify-center">pricing</span>
        <h2 className="text-4xl md:text-5xl">Simple, predictable.</h2>
        <p className="mx-auto max-w-xl text-lg text-muted">
          Start free. Upgrade when you outgrow it. Self-host any time.
        </p>
      </div>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {TIERS.map((t) => {
          const dark = t.popular;
          return (
            <li
              key={t.name}
              className={
                "relative flex flex-col gap-6 rounded-2xl p-7 " +
                (dark
                  ? "bg-ink text-cream ring-1 ring-ink"
                  : "border border-line bg-cream/60")
              }
            >
              {dark && (
                <span className="absolute top-5 right-5 rounded-full bg-indigo px-2.5 py-1 font-mono text-[10px] tracking-widest text-white uppercase">
                  popular
                </span>
              )}

              <p
                className={
                  "font-mono text-[11px] tracking-widest uppercase " +
                  (dark ? "text-cream/60" : "text-muted")
                }
              >
                {t.name}
              </p>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">
                  {t.price}
                </span>
                <span
                  className={
                    "text-sm " + (dark ? "text-cream/60" : "text-muted")
                  }
                >
                  {t.suffix}
                </span>
              </div>

              <p
                className={
                  "text-sm leading-relaxed " +
                  (dark ? "text-cream/75" : "text-muted")
                }
              >
                {t.blurb}
              </p>

              <ul className="space-y-2 text-sm">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span
                      className={dark ? "text-emerald-400" : "text-emerald-600"}
                    >
                      ✓
                    </span>
                    <span className={dark ? "text-cream/90" : "text-ink/90"}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={t.cta.href}
                className={
                  "mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium " +
                  (dark
                    ? "bg-cream text-ink hover:bg-white"
                    : "border border-line bg-cream/80 text-ink hover:bg-cream-soft")
                }
              >
                {t.cta.label}
                <span aria-hidden>→</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
