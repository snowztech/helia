const FEATURES = [
  {
    icon: "✦",
    title: "Knowledge.",
    body: "Drop in PDFs, paste text, or crawl your website. Helia chunks, embeds, and keeps it in sync automatically.",
    tags: ["PDF", "text", "websites", "Notion", "Google Docs"],
  },
  {
    icon: "⌘",
    title: "Tools.",
    body: "Look up orders, query your database, create tickets. Helia picks the right tool and only does what you allow.",
    tags: ["SQL", "REST", "web search", "actions", "custom"],
  },
  {
    icon: "◐",
    title: "Widget.",
    body: "One snippet, lots of control. Floating bubble or inline embed. Brand it, place it, watch the conversations.",
    tags: ["floating", "inline", "themes", "react · html"],
  },
];

export function Features() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-6 py-24">
      <div className="space-y-4">
        <span className="eyebrow">what helia does</span>
        <h2 className="text-4xl md:text-5xl">Three things, done well.</h2>
        <p className="max-w-2xl text-lg text-muted">
          Connect your knowledge, give it tools, and put it on your site. No
          prompt-engineering required.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="flex flex-col gap-5 rounded-2xl border border-line bg-cream-soft/60 p-7"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-fade text-lg text-indigo">
              {f.icon}
            </span>
            <h3 className="text-xl">{f.title}</h3>
            <p className="leading-relaxed text-muted">{f.body}</p>
            <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
              {f.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-md border border-line bg-cream/70 px-2 py-1 font-mono text-[11px] text-muted"
                >
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
