"use client";

import { useState } from "react";
import { CopyCode } from "./copy-code";

const frameworks = ["next", "express"] as const;

type Framework = (typeof frameworks)[number];

const examples: Record<Framework, { label: string; title: string; code: string }> = {
  next: {
    label: "Next.js",
    title: "app/api/helia/token/route.ts",
    code: `import { signIdentity } from "@gethelia/server";

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  return Response.json(
    signIdentity(
      { id: user.id, name: user.name },
      process.env.HELIA_IDENTITY_SECRET!,
    ),
  );
}`,
  },
  express: {
    label: "Express",
    title: "server.ts",
    code: `import express from "express";
import { signIdentity } from "@gethelia/server";

const app = express();

app.get("/api/helia/token", requireAuth, (req, res) => {
  res.json(
    signIdentity(
      { id: req.user.id, name: req.user.name },
      process.env.HELIA_IDENTITY_SECRET!,
    ),
  );
});`,
  },
};

export function BackendEndpointExamples() {
  const [framework, setFramework] = useState<Framework>("next");
  const example = examples[framework];

  return (
    <div className="space-y-3">
      <div
        className="inline-flex rounded-lg border border-line bg-card p-1"
        aria-label="Backend framework"
      >
        {frameworks.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFramework(option)}
            aria-pressed={framework === option}
            className={[
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              framework === option
                ? "bg-fg text-bg"
                : "text-muted hover:bg-muted-bg hover:text-fg",
            ].join(" ")}
          >
            {examples[option].label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-[#101010]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
          <div>
            <p className="text-[11px] text-zinc-300">
              Backend token endpoint
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {example.title}
            </p>
          </div>
          <CopyCode code={example.code} />
        </div>
        <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-[#f2f2f2]">
          <code>{example.code}</code>
        </pre>
      </div>
    </div>
  );
}
