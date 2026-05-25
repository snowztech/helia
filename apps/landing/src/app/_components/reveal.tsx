"use client";

import { useEffect } from "react";

/**
 * Mounts once. Marks <body> ready so CSS can apply the initial hidden state,
 * then unhides any `.reveal` element when it enters the viewport. No deps,
 * no library, no jank.
 */
export function RevealOnScroll() {
  useEffect(() => {
    document.body.classList.add("js-ready");

    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
