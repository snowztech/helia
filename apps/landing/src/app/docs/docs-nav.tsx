"use client";

import { useEffect, useState } from "react";

export type DocsSectionLink = {
  id: string;
  label: string;
};

export function DocsNav({ sections }: { sections: DocsSectionLink[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0.08, 0.18, 0.32],
      },
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-24 space-y-1 text-[13px]" aria-label="Docs">
      {sections.map((section) => {
        const active = activeId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active ? "location" : undefined}
            className={[
              "block border-l px-3 py-1.5 transition-colors",
              active
                ? "border-primary text-fg"
                : "border-line text-muted hover:border-fg/40 hover:text-fg",
            ].join(" ")}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
