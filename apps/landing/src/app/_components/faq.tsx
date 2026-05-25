const FAQS = [
  {
    q: "Do you train on my data?",
    a: "No. Your sources, conversations, and tool calls stay in your workspace. The LLM provider (OpenAI by default) receives only the context needed to answer the current turn.",
  },
  {
    q: "Which LLMs do you support?",
    a: "OpenAI today (gpt-4o-mini, gpt-4o). Anthropic and Mistral are on the roadmap. Self-hosters can point at any OpenAI-compatible endpoint.",
  },
  {
    q: "Is Helia really open source?",
    a: "Yes. AGPL-3.0. The core agent, RAG, widget, and admin are all on GitHub. The hosted product runs the same code you can run yourself.",
  },
  {
    q: "Can I self-host?",
    a: "Yes. Docker compose, Railway, Hetzner, Fly — anywhere that runs Postgres and Node. Bring your own OpenAI key. Full guide in the repo.",
  },
  {
    q: "What about hallucinations?",
    a: "Helia answers from your sources when it has them. When it doesn't, it says so instead of guessing. Every answer cites the chunks it pulled.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="space-y-4">
        <span className="eyebrow">faq</span>
        <h2 className="text-4xl md:text-5xl">Questions, briefly answered.</h2>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((f) => (
          <li key={f.q}>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-base font-medium">
                {f.q}
                <span className="font-mono text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 leading-relaxed text-muted">{f.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
