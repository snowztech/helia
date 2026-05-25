const PARTNERS = [
  "Notion",
  "Slack",
  "Linear",
  "HubSpot",
  "Stripe",
  "Postgres",
  "Zapier",
];

export function PlaysWith() {
  return (
    <section className="border-y border-line/60 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          plays nicely with
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-lg font-semibold text-muted-soft md:text-xl">
          {PARTNERS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
