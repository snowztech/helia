import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../_components/footer";
import { HeliaWordmark } from "../_components/logo";
import { ThemeToggle } from "../_components/theme-toggle";
import { CopyCode } from "./copy-code";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gethelia.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Install Helia on your site or app. Script tag, React SDK, and signed user identity.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

const sections = [
  { id: "install-paths", label: "install paths" },
  { id: "start", label: "start" },
  { id: "widget", label: "widget" },
  { id: "react", label: "react" },
  { id: "identity", label: "identity" },
  { id: "self-host", label: "self-host" },
];

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

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[180px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 text-[13px] text-muted">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block transition-colors hover:text-fg"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-14">
          <section className="space-y-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
            >
              <span aria-hidden>←</span> back
            </Link>
            <div className="space-y-3">
              <p className="eyebrow">docs</p>
              <h1 className="max-w-3xl text-4xl tracking-tight md:text-5xl">
                install Helia without guessing which path you need.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                The script tag is the default. The SDKs are optional helpers
                for React apps and signed user identity. Hosted and self-hosted
                Helia use the same integration model.
              </p>
            </div>
          </section>

          <DocSection id="install-paths" title="Install paths">
            <div className="overflow-x-auto rounded-lg border border-line bg-card">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">you are doing this</th>
                    <th className="px-4 py-3 font-medium">use</th>
                    <th className="px-4 py-3 font-medium">install command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <PathRow
                    task="Adding Helia to a website or CMS"
                    use="HTML snippet from the admin"
                    command="none"
                  />
                  <PathRow
                    task="Adding Helia to a React or Next.js app"
                    use="@gethelia/react"
                    command="pnpm add @gethelia/react"
                  />
                  <PathRow
                    task="Identifying logged-in users"
                    use="@gethelia/server"
                    command="pnpm add @gethelia/server"
                  />
                  <PathRow
                    task="Running Helia on your own server"
                    use="Docker compose"
                    command="docker compose up -d"
                  />
                </tbody>
              </table>
            </div>
          </DocSection>

          <DocSection id="start" title="Start">
            <p>
              First choose where Helia runs. If you use Helia Cloud, open the
              hosted admin. If you self-host, open your own Helia admin domain.
              In both cases, the widget page generates the right snippet.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                title="Helia Cloud"
                text="Configure your assistant at app.gethelia.dev. Snippets load w.js from Helia Cloud."
              />
              <InfoCard
                title="Self-hosted"
                text="Configure your assistant at your own Helia URL. Snippets load w.js from your server."
              />
            </div>
            <Callout>
              Do not hardcode these examples blindly. In production, copy the
              exact snippet from your Helia admin because it contains your
              workspace id and the right hosted or self-hosted widget URL.
            </Callout>
          </DocSection>

          <DocSection id="widget" title="Widget">
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
  data-workspace="00000000-0000-0000-0000-000000000000"
  async
></script>`}
            />
            <p>
              Embedded mode mounts the chat inside a container. Give the
              container a height or the widget will collapse.
            </p>
            <CodeBlock
              title="Embedded HTML snippet"
              code={`<div id="helia-chat" style="height: 600px"></div>
<script
  src="https://your-helia-admin/w.js"
  data-workspace="00000000-0000-0000-0000-000000000000"
  data-mode="embedded"
  data-target="#helia-chat"
  async
></script>`}
            />
          </DocSection>

          <DocSection id="react" title="React">
            <p>
              Use the React SDK when the widget lives inside a React or Next.js
              app shell.
            </p>
            <StepList
              items={[
                "Install the React package in your app.",
                "Render HeliaWidget in your app shell.",
                "Use embedded mode if the chat should live inside a page area.",
              ]}
            />
            <CodeBlock title="Install" code="pnpm add @gethelia/react" />
            <CodeBlock
              title="Floating widget"
              code={`import { HeliaWidget } from "@gethelia/react";

export function AppShell() {
  return <HeliaWidget workspace="00000000-0000-0000-0000-000000000000" />;
}`}
            />
            <p>Embedded React mode renders its own target container.</p>
            <CodeBlock
              title="Embedded widget"
              code={`<HeliaWidget
  workspace="00000000-0000-0000-0000-000000000000"
  mode="embedded"
  style={{ height: 600 }}
/>`}
            />
          </DocSection>

          <DocSection id="identity" title="Identity">
            <p>
              Identity is for logged-in products. Your backend signs the
              current user; Helia verifies that signature before the chat turn.
              This works the same on Helia Cloud and self-hosted Helia.
            </p>
            <StepList
              items={[
                "Generate an identity secret in Helia Settings.",
                "Store it as HELIA_IDENTITY_SECRET in your backend.",
                "Add a token endpoint that returns signIdentity(...).",
                "Connect tokenEndpoint to the widget.",
                "Enable Reject anonymous chats after signed traffic works.",
              ]}
            />
            <CodeBlock title="Install" code="pnpm add @gethelia/server" />
            <CodeBlock
              title="Token endpoint"
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
  workspace="00000000-0000-0000-0000-000000000000"
  tokenEndpoint="/api/helia/token"
/>`}
            />
            <CodeBlock
              title="HTML widget with identity"
              code={`<script
  src="https://your-helia-admin/w.js"
  data-workspace="00000000-0000-0000-0000-000000000000"
  data-token-endpoint="/api/helia/token"
  async
></script>`}
            />
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
              After signup, open the widget page in your admin and copy the
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

function PathRow({
  task,
  use,
  command,
}: {
  task: string;
  use: string;
  command: string;
}) {
  return (
    <tr>
      <td className="px-4 py-3 text-fg">{task}</td>
      <td className="px-4 py-3 text-muted">{use}</td>
      <td className="px-4 py-3">
        <code className="rounded bg-muted-bg px-1.5 py-0.5 text-[11px] text-fg">
          {command}
        </code>
      </td>
    </tr>
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
