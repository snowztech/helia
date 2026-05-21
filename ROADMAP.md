# Roadmap

This is what Helia is going to be and when. It is a working document. Things will move.

Today (2026-05-21) Helia is a working doc-RAG agent with an admin UI. The roadmap below turns it into a product small businesses can drop on their site or inside their app.

## Vision

> Open-source AI assistant you can self-host or run on our cloud. Bring your own docs and your own API. Drop one script tag.

The same widget serves three deployments without code changes:

1. **Public site widget.** Anonymous visitor asks about products, hours, returns. Pure doc retrieval.
2. **Internal dashboard widget.** Authenticated employee asks about live data. Agent calls the business's own API to fetch it.
3. **Self-hosted everything.** Same code, runs on the business's infra. AGPL.

## v1 (8 weeks, target 2026-07-16)

The smallest thing that is actually a product. Public widget mode only.

**Already in main.** API, doc ingest (PDF / URL / text), hybrid retrieval, agent loop with `search_knowledge`, web admin UI, SSE chat.

**Must ship.**

- `packages/widget`. 30 KB vanilla JS embed. Shadow DOM. One script tag.
- Workspace auth. API keys, CORS allowlist per workspace, `better-auth` for admin login.
- Multi-workspace. Admin can create and switch between N workspaces.
- Rate limiting. Per visitor IP and per workspace token quota.
- Branding. Per-workspace theme: colors, logo, bot name, greeting, launcher position, tone, font. Stored as JSON, applied via CSS variables inside the shadow root. See [`docs/widget.md`](docs/widget.md).
- Basic analytics. Messages per day, top questions, unanswered count, sources cited.
- Provider switch. OpenAI default, Mistral and Anthropic selectable per workspace.
- Hosted infra. One-click deploy on Vercel + Neon (Postgres + pgvector). Also a Fly + managed-PG path documented.
- Billing. Stripe checkout, webhook flips tier, hard cap on message overrun.
- Landing page. Demo, pricing, self-host vs cloud table.
- Docs site. Quickstart, widget API, self-host guide.

**Out of scope for v1.** Live business data, authenticated end users, Slack / WhatsApp channels, workflow builder, per-end-user data scoping, evaluation harness as a paid feature.

## v1.5 (weeks 9–12, target 2026-08-13)

Once v1 is live, the next thing customers will ask for is "can the assistant answer about my data, not just my docs." We answer with HTTP custom tools.

- **HTTP custom tools.** Workspace registers an HTTP endpoint with an OpenAPI snippet. The agent calls the endpoint server-to-server with the workspace API key in a header. The business does its own auth, DB query, and redaction inside the endpoint. Helia never touches the business's database directly.
- **Authenticated dashboard mode.** Widget accepts a signed JWT from the host app. Helia verifies it with the workspace's public key. Agent gets a verified `user_id` in `ctx`. Tools can use it. Unlocks "internal admin panel assistant."
- **Lead capture.** A built-in tool the agent calls to save a visitor email or phone before handing off. Stored on the workspace, visible in admin.
- **Human handoff.** When the agent can't help, drop the conversation into a workspace inbox. Email notification by default, Slack webhook optional.

## v2 (after first 25 paying customers)

Decided by what the beta cohort actually asks for. Likely candidates:

- Slack and WhatsApp channels. Same agent, different transports. Reuses the tool registry.
- Workflow builder. Multi-step actions on top of the tool registry. Visual editor in admin.
- Eval harness as a feature. Workspace defines test questions and expected behavior. Runs nightly. Email on regressions.
- Per-end-user data scoping. The hard case where each customer of the business sees only their own data through the widget. Requires signed end-user tokens and row-level scoping. Real but rare.

## What stays out of the roadmap

A few things are not coming back, on purpose.

- A separate worker process or pg-boss queue. The collapse into one Postgres explained in [`ARCHITECTURE.md`](ARCHITECTURE.md) is intentional and we are sticking with it until a real bottleneck shows up.
- A plugin system. Tools are imported as TypeScript packages by the API. We will not build dynamic loading until at least three external tool packages exist in the wild.
- Direct database connectors. We do not give Helia your DB credentials. The HTTP-tool pattern in v1.5 is the supported path for live data.

## How we decide what ships

Three rules.

1. No new feature without a named user who asked for it.
2. No abstraction before three concrete cases exist.
3. Every shipped feature comes with the smallest evaluation we can write for it. If we cannot tell whether it works, we did not ship it.

## Status of this document

This file is the source of truth for what is on the table right now. Issues and PRs link back to a section here. If a section is missing, that work is not committed yet.
