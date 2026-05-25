const STEPS = [
  {
    n: "01",
    title: "Connect a source.",
    body: "Upload a PDF or paste a URL. We chunk and embed it in seconds.",
  },
  {
    n: "02",
    title: "Plug in your tools.",
    body: "Point Helia at your APIs or database. It calls them only when needed.",
  },
  {
    n: "03",
    title: "Embed the widget.",
    body: "Paste one script tag. Customize colors and copy from the dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="border-y border-line/60 bg-cream-soft/40 py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-4">
          <span className="eyebrow">how it works</span>
          <h2 className="text-4xl md:text-5xl">Live in 10 minutes.</h2>
          <p className="max-w-2xl text-lg text-muted">
            No vendor lock-in, no model surprises. Bring your own keys, or use
            ours.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="space-y-3 bg-cream p-7 first:rounded-l-2xl last:rounded-r-2xl"
            >
              <span className="font-mono text-[11px] tracking-widest text-indigo">
                {s.n}
              </span>
              <h3 className="text-xl">{s.title}</h3>
              <p className="leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
