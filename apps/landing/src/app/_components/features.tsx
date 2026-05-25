const FEATURES = [
  {
    n: "01",
    title: "knowledge.",
    body: "PDFs, pasted text, or a website crawl. Helia chunks, embeds, and keeps it in sync.",
  },
  {
    n: "02",
    title: "tools.",
    body: "Look up orders, query a database, create a ticket. Helia calls what you allow.",
  },
  {
    n: "03",
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
            <span className="text-[11px] tracking-widest text-primary">
              {f.n}
            </span>
            <h3 className="mt-3 text-lg">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
