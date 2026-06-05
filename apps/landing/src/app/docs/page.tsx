import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../_components/footer";
import { HeliaWordmark } from "../_components/logo";
import { ThemeToggle } from "../_components/theme-toggle";
import { CopyCode } from "./copy-code";
import { DocsNav } from "./docs-nav";
import { InstallCommands } from "./install-commands";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gethelia.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Install Helia on your site or app. Script tag, React SDK, and signed user identity.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

const sections = [
  { id: "start", label: "quick start" },
  { id: "script-tag", label: "script tag" },
  { id: "react", label: "react / next" },
  { id: "identity", label: "signed users" },
  { id: "self-host", label: "self-host" },
];

const workspaceId = "00000000-0000-0000-0000-000000000000";

export default function DocsPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Helia home">
            <HeliaWordmark />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center rounded-lg bg-fg px-4 py-2 text-[13px] font-medium text-bg transition-transform duration-150 hover:-translate-y-px hover:opacity-95"
            >
              start free
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[180px_1fr]">
        <aside className="hidden lg:block">
          <DocsNav sections={sections} />
        </aside>

        <div className="min-w-0 space-y-12">
          <section className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
            >
              <span aria-hidden>←</span> back
            </Link>
            <div className="space-y-3">
              <p className="eyebrow">docs</p>
              <h1 className="max-w-3xl text-3xl tracking-tight md:text-4xl">
                Add Helia to your site or app.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                Most sites paste one script tag from the Helia admin. Use the
                SDK packages only when you need React/Next.js integration or
                signed user identity.
              </p>
            </div>
          </section>

          <DocSection id="start" title="Quick start">
            <p>
              Start from the Helia admin you use. Cloud users open
              `app.gethelia.dev`; self-hosted users open their own Helia admin
              domain.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                title="Website or CMS"
                text="No npm package. Copy the script tag from the Widget page."
              />
              <InfoCard
                title="React or Next.js app"
                text="Install @gethelia/react when the widget lives inside your app shell."
              />
              <InfoCard
                title="Logged-in users"
                text="Install @gethelia/server only when your backend signs user identity."
              />
            </div>
            <InstallCommands />
            <Callout>
              You only need `@gethelia/server` when your backend signs logged-in
              users. Anonymous widgets do not need a backend package.
            </Callout>
          </DocSection>

          <DocSection id="script-tag" title="Script tag">
            <p>
              For websites, CMS pages, and most marketing sites, no npm package
              is needed. Paste the snippet from your Helia admin.
            </p>
            <Callout>
              Replace `https://your-helia-admin` and the workspace id only when
              writing examples by hand. The admin-generated snippet already
              fills both values correctly.
            </Callout>
            <StepList
              items={[
                "Open Helia admin -> Widget.",
                "Pick floating or embedded mode.",
                "Copy the HTML snippet.",
                "Paste it before </body> or in your CMS custom HTML area.",
              ]}
            />
            <CodeBlock
              title="HTML snippet"
              code={`<script
  src="https://your-helia-admin/w.js"
  data-workspace="${workspaceId}"
  async
></script>`}
            />
            <Details title="Optional: embedded widget">
              <p className="mb-3">
                Embedded mode mounts the chat inside a container. Give the
                container a height or the widget will collapse.
              </p>
              <CodeBlock
                title="Embedded HTML snippet"
                code={`<div id="helia-chat" style="height: 600px"></div>
<script
  src="https://your-helia-admin/w.js"
  data-workspace="${workspaceId}"
  data-mode="embedded"
  data-target="#helia-chat"
  async
></script>`}
              />
            </Details>
          </DocSection>

          <DocSection id="react" title="React / Next.js">
            <p>
              Use the React SDK in a client component. The widget needs the
              browser, so do not render it from a server component directly.
            </p>
            <StepList
              items={[
                "Install @gethelia/react.",
                "Create a small client component for the widget.",
                "Render that component from your layout or app shell.",
              ]}
            />
            <CodeBlock
              title="app/helia-widget.tsx"
              code={`"use client";

import { HeliaWidget } from "@gethelia/react";

export function HeliaSupportWidget() {
  return <HeliaWidget workspace="${workspaceId}" />;
}`}
            />
            <CodeBlock
              title="app/layout.tsx"
              code={`import { HeliaSupportWidget } from "./helia-widget";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <HeliaSupportWidget />
      </body>
    </html>
  );
}`}
            />
          </DocSection>

          <DocSection id="identity" title="Signed users">
            <p>
              Use signed identity when Helia should know who is chatting. Your
              backend returns a signed identity for the current user; Helia
              verifies that signature on chat requests. This works the same on
              Helia Cloud and self-hosted Helia.
            </p>
            <StepList
              items={[
                "Install @gethelia/server in your backend.",
                "Generate an identity secret in Helia Settings.",
                "Store it as HELIA_IDENTITY_SECRET on the server.",
                "Return signIdentity(...) from a token endpoint after your own auth resolves the user.",
                "Pass tokenEndpoint to the React widget or data-token-endpoint to the script tag.",
                "Enable Reject anonymous chats only after signed traffic works.",
              ]}
            />
            <CodeBlock
              title="Next.js route handler"
              code={`import { signIdentity } from "@gethelia/server";

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  return Response.json(
    signIdentity(
      { id: user.id, name: user.name },
      process.env.HELIA_IDENTITY_SECRET!,
    ),
  );
}`}
            />
            <p>
              Then connect the token endpoint to the widget. Enable “Reject
              anonymous chats” only after signed users work in production.
            </p>
            <CodeBlock
              title="React widget with identity"
              code={`<HeliaWidget
  workspace="${workspaceId}"
  tokenEndpoint="/api/helia/token"
/>`}
            />
            <CodeBlock
              title="HTML widget with identity"
              code={`<script
  src="https://your-helia-admin/w.js"
  data-workspace="${workspaceId}"
  data-token-endpoint="/api/helia/token"
  async
></script>`}
            />
            <Details title="Optional: Express endpoint">
              <CodeBlock
                title="Node / Express"
                code={`import express from "express";
import { signIdentity } from "@gethelia/server";

const app = express();

app.get("/api/helia/token", requireAuth, (req, res) => {
  res.json(
    signIdentity(
      { id: req.user.id, name: req.user.name },
      process.env.HELIA_IDENTITY_SECRET!,
    ),
  );
});`}
              />
            </Details>
          </DocSection>

          <DocSection id="self-host" title="Self-host">
            <p>
              To install Helia itself, use Docker. This is separate from
              installing the assistant on a customer-facing site.
            </p>
            <CodeBlock
              title="Run Helia"
              code={`git clone https://github.com/snowztech/helia
cd helia
cp .env.example .env
# edit .env and set OPENAI_API_KEY and MASTER_KEY
docker compose up -d`}
            />
            <p>
              After your admin is running, open the Widget page and copy the
              generated snippet. It will point at your self-hosted `w.js`.
            </p>
          </DocSection>
        </div>
      </main>

      <Footer />
    </>
  );
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="border-b border-line pb-3 text-2xl tracking-tight">
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-7 text-muted">{children}</div>
    </section>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <h3 className="text-sm text-fg">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-muted">{text}</p>
    </div>
  );
}

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted-bg text-[11px] text-fg">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-xs leading-6 text-fg/80">
      {children}
    </div>
  );
}

function Details({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-lg border border-line bg-card px-4 py-3">
      <summary className="cursor-pointer text-sm text-fg">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-[#101010]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <span className="text-[11px] text-zinc-400">{title ?? "snippet"}</span>
        <CopyCode code={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-[#f2f2f2]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
