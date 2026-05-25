const STEPS = [
  {
    n: "01",
    title: "connect a source.",
    body: "Upload a PDF or paste a URL. Indexed in seconds.",
  },
  {
    n: "02",
    title: "plug in tools.",
    body: "Point at your APIs or DB. Scoped to what you allow.",
  },
  {
    n: "03",
    title: "embed the widget.",
    body: "One script tag. Live for your visitors immediately.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="border-y border-line bg-muted-bg/40 py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="space-y-3 reveal">
          <span className="eyebrow">how it works</span>
          <h2 className="text-3xl md:text-4xl">live in 10 minutes.</h2>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="reveal space-y-3 bg-bg p-6 transition-colors hover:bg-muted-bg/70"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="text-[11px] tracking-widest text-primary">
                {s.n}
              </span>
              <h3 className="text-lg">{s.title}</h3>
              <p className="text-[14px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
