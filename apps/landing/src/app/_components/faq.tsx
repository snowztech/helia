const FAQS = [
  {
    q: "do you train on my data?",
    a: "No. Your sources and conversations stay in your workspace. The model sees only what's needed to answer the current turn.",
  },
  {
    q: "which models do you support?",
    a: "OpenAI today. Anthropic and Mistral next. Self-hosters can point at any OpenAI-compatible endpoint.",
  },
  {
    q: "can i self-host?",
    a: "Yes. Docker compose, Railway, Hetzner, Fly. Anywhere that runs Postgres and Node.",
  },
  {
    q: "what about hallucinations?",
    a: "Helia answers from your sources when it has them. When it doesn't, it says so instead of guessing.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="space-y-3 reveal">
        <span className="eyebrow">faq</span>
        <h2 className="text-3xl md:text-4xl">questions, briefly answered.</h2>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((f, i) => (
          <li
            key={f.q}
            className="reveal"
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15px] font-medium transition-colors hover:text-fg">
                {f.q}
                <span className="text-muted transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
