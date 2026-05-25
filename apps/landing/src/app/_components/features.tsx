const FEATURES = [
  {
    title: "knowledge.",
    body: "PDFs, pasted text, or a website crawl. Helia chunks, embeds, and keeps it in sync.",
  },
  {
    title: "tools.",
    body: "Look up orders, query a database, create a ticket. Helia calls what you allow.",
  },
  {
    title: "widget.",
    body: "One script tag. Brand colour, copy, suggestions. Floating or inline.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-24">
      <div className="space-y-3 reveal">
        <span className="eyebrow">what helia does</span>
        <h2 className="text-3xl md:text-4xl">three things, done well.</h2>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <li
            key={f.title}
            className="reveal rounded-2xl border border-line bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-fg/15"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <h3 className="text-lg">{f.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {f.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
