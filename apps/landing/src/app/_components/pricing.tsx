const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

const TIERS = [
  {
    name: "starter",
    price: "$0",
    suffix: "forever free",
    bullets: ["100 messages / mo", "1 workspace", "Floating widget"],
    cta: { label: "start free", href: `${APP_URL}/signup` },
    accent: false,
  },
  {
    name: "pro",
    price: "$29",
    suffix: "/ workspace / mo",
    bullets: [
      "1,500 messages / mo",
      "Unlimited sources",
      "Inline embed, branding",
      "Tools (DB, REST)",
    ],
    cta: { label: "start pro", href: `${APP_URL}/signup?plan=pro` },
    accent: true,
  },
  {
    name: "scale",
    price: "custom",
    suffix: "",
    bullets: ["Unlimited messages", "SSO, audit log", "Self-host", "SLA"],
    cta: { label: "talk to us", href: "mailto:gethelia@protonmail.com" },
    accent: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
      <div className="space-y-3 text-center reveal">
        <span className="eyebrow justify-center">pricing</span>
        <h2 className="text-3xl md:text-4xl">simple, predictable.</h2>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {TIERS.map((t, i) => {
          const dark = t.accent;
          return (
            <li
              key={t.name}
              className={
                "reveal relative flex flex-col gap-5 rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-0.5 " +
                (dark
                  ? "bg-[#0a0a0a] text-[#f7f7f5]"
                  : "border border-line bg-card hover:border-fg/15")
              }
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <p
                className={
                  "text-[10px] tracking-widest uppercase " +
                  (dark ? "text-white/55" : "text-muted")
                }
              >
                {t.name}
              </p>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                  {t.price}
                </span>
                <span
                  className={
                    "text-xs " + (dark ? "text-white/55" : "text-muted")
                  }
                >
                  {t.suffix}
                </span>
              </div>

              <ul className="space-y-1.5 text-sm">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span
                      className={
                        "mt-0.5 " +
                        (dark ? "text-emerald-400" : "text-emerald-600")
                      }
                    >
                      ✓
                    </span>
                    <span className={dark ? "text-white/90" : "text-fg/85"}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={t.cta.href}
                className={
                  "mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform duration-150 hover:-translate-y-px " +
                  (dark
                    ? "bg-white text-[#0a0a0a]"
                    : "border border-line bg-bg text-fg")
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
