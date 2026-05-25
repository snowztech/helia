const STATS = [
  { label: "deflection rate", value: "78%", note: "of questions answered without a human" },
  { label: "setup time", value: "10 min", note: "from signup to live widget" },
  { label: "avg response", value: "1.4 s", note: "to start streaming an answer" },
  { label: "teams", value: "200+", note: "small businesses and creators" },
];

export function Stats() {
  return (
    <section className="border-y border-line/60 bg-cream-soft/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-4 text-center">
          <span className="eyebrow justify-center">the numbers</span>
          <h2 className="mx-auto max-w-3xl text-4xl md:text-5xl">
            Less time on tickets. More time on the work that matters.
          </h2>
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-4">
          {STATS.map((s) => (
            <li
              key={s.label}
              className="space-y-3 rounded-2xl border border-line bg-cream/70 p-6"
            >
              <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
                {s.label}
              </p>
              <p className="text-4xl font-bold tracking-tight">{s.value}</p>
              <p className="text-sm leading-relaxed text-muted">{s.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
