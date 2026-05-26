"use client";

import { useEffect, useState } from "react";
import { HeliaMark } from "./logo";

/**
 * Interactive hero mock. Plays a scripted Q&A so the visitor can poke
 * the widget without hitting the real API. Visuals mirror the deployed
 * `packages/widget` panel and adapt to the landing's light/dark theme
 * so the mock never clashes with the page.
 *
 * Phase 2: swap for the actual widget bundle pointed at a demo
 * workspace.
 */

type Msg = { role: "bot" | "user"; text: string };

const SCRIPT: Array<{ q: string; a: string }> = [
  {
    q: "how do i install?",
    a: "drop one script tag on your site, paste your workspace id, you're live. that's it.",
  },
  {
    q: "do you train on my data?",
    a: "no. your sources stay in your workspace. the model only sees what's needed for the current turn.",
  },
  {
    q: "can i self-host?",
    a: "yes. docker compose, railway, fly — anywhere postgres and node run. bring your own openai key.",
  },
];

const INITIAL: Msg[] = [{ role: "bot", text: "hi, how can i help?" }];

export function HeroChat() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [typing, setTyping] = useState(false);

  const available = SCRIPT.map((s, i) => ({ ...s, i })).filter(
    (s) => !used.has(s.i),
  );

  const ask = (i: number) => {
    if (used.has(i) || typing) return;
    const entry = SCRIPT[i];
    if (!entry) return;
    setUsed((u) => new Set(u).add(i));
    setMessages((m) => [...m, { role: "user", text: entry.q }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "bot", text: entry.a }]);
    }, 1100);
  };

  const reset = () => {
    setMessages(INITIAL);
    setUsed(new Set());
    setTyping(false);
  };

  return (
    <div className="relative reveal">
      {/* Soft glow behind the panel */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(42,100,214,0.22),transparent_65%)]"
      />

      {/* Panel — uses landing theme tokens so it adapts to light/dark */}
      <div className="flex w-full max-w-[400px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
        {/* Header (always indigo — brand) */}
        <div className="flex items-center gap-2.5 bg-primary px-4 py-3.5 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <HeliaMark fullBox className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold leading-tight">Helia</div>
            <div className="text-[12px] opacity-85">ask anything</div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={reset}
            title="Reset conversation"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex h-[300px] flex-col gap-2 overflow-y-auto bg-card px-4 py-4 text-[13px]">
          {messages.map((m, idx) => (
            <Bubble key={idx} role={m.role} text={m.text} />
          ))}
          {typing && <TypingDots />}

          {available.length > 0 && !typing && (
            <ul className="mt-2 space-y-1.5">
              {available.map((s) => (
                <li key={s.i}>
                  <button
                    type="button"
                    onClick={() => ask(s.i)}
                    className="w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-left text-[12.5px] text-fg transition-all duration-150 hover:-translate-y-px hover:border-primary/50 hover:bg-primary/10"
                  >
                    {s.q}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 border-t border-line bg-card px-3 py-3">
          <div className="flex h-9 flex-1 items-center rounded-full border border-line bg-bg px-4 text-[12.5px] text-muted">
            write something…
          </div>
          <button
            type="button"
            aria-label="Send"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_14px_-4px_rgba(42,100,214,0.55)] transition-transform hover:-translate-y-px"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1.5 border-t border-line bg-card py-2 text-[11px] text-muted">
          <span>powered by</span>
          <span className="inline-flex items-center gap-1 font-semibold text-fg/80">
            <HeliaMark fullBox className="h-3 w-3 text-primary" />
            helia
          </span>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: Msg["role"]; text: string }) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-white">
        {text}
      </div>
    );
  }
  return <BotBubble text={text} />;
}

function BotBubble({ text }: { text: string }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    const words = text.split(/(\s+)/);
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setShown(words.slice(0, i).join(""));
      if (i < words.length) {
        setTimeout(tick, 35 + Math.random() * 35);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted-bg px-3 py-2 text-fg">
      {shown}
      {shown.length < text.length && (
        <span className="ml-0.5 inline-block h-3 w-[1.5px] -translate-y-px animate-pulse bg-fg/40 align-middle" />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="inline-flex max-w-[60%] items-center gap-1 rounded-2xl rounded-bl-md bg-muted-bg px-3 py-2.5">
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-fg/40"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
