"use client";

import { useState } from "react";
import { CopyCode } from "./copy-code";

const packageManagers = ["pnpm", "npm"] as const;

type PackageManager = (typeof packageManagers)[number];

const commands: Record<PackageManager, { react: string; server: string }> = {
  pnpm: {
    react: "pnpm add @gethelia/react",
    server: "pnpm add @gethelia/server",
  },
  npm: {
    react: "npm install @gethelia/react",
    server: "npm install @gethelia/server",
  },
};

export function InstallCommands() {
  const [manager, setManager] = useState<PackageManager>("pnpm");

  return (
    <div className="space-y-3">
      <div
        className="inline-flex rounded-lg border border-line bg-card p-1"
        aria-label="Package manager"
      >
        {packageManagers.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setManager(option)}
            aria-pressed={manager === option}
            className={[
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              manager === option
                ? "bg-fg text-bg"
                : "text-muted hover:bg-muted-bg hover:text-fg",
            ].join(" ")}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InstallCommand
          title="React / Next.js"
          note="Only for app shells."
          command={commands[manager].react}
        />
        <InstallCommand
          title="Signed users"
          note="Only for backend identity."
          command={commands[manager].server}
        />
      </div>
    </div>
  );
}

function InstallCommand({
  title,
  note,
  command,
}: {
  title: string;
  note: string;
  command: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-[#101010]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[11px] text-zinc-300">{title}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">{note}</p>
        </div>
        <CopyCode code={command} />
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-[#f2f2f2]">
        <code>{command}</code>
      </pre>
    </div>
  );
}
