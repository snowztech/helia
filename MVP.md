# MVP

The simplest version of Helia that small businesses can actually use and pay for.

Start date: 2026-05-25 (Monday).
Target ship: 2026-07-20 (Monday). Eight weeks.
Target outcome: three small businesses paying, one of them fitdistance as the design partner.

## The pitch in one sentence

> Helia is the simplest way to give your business its own AI assistant. Upload your docs, optionally plug in your data, drop one script tag. Open-source.

That is the whole thing. Same product flexes for a bakery (docs only) and for fitdistance (docs plus HTTP tools calling their search API). We do not pick segments.

## What is built today (2026-05-21)

- API: Hono, doc ingest (PDF, URL, text), hybrid retrieval, agent loop with `search_knowledge`, SSE chat.
- Admin UI: upload, source timeline, chat page.
- Postgres + pgvector schema, Drizzle, `make setup`, `make dev`.

What is missing to charge money and serve real customers:

- A widget to drop on any site or inside any app.
- A way to identify a workspace and lock it to a domain.
- A way to plug live data via HTTP custom tools.
- Per-end-user identity for tools that need it (e.g. fitdistance's coach scoping).
- Observability so we can debug a bad answer.
- A real onboarding flow.
- A way to take €99.

Eight weeks to close that gap.

## Three building blocks

The whole product is three things. Each one serves all customer types.

1. **Docs.** PDF, URL, text. Already works. Default starting point.
2. **Tools.** HTTP custom tools the agent can call. Optional. Customer adds an endpoint, the agent calls it when relevant.
3. **Widget.** Themed embed. Public mode (anonymous) or signed-JWT mode (per-end-user identity). Same script tag, different config.

A bakery only ever uses (1) and (3). Fitdistance uses all three with the JWT mode. Same product.

## The eight weeks

High-level phasing. The day-by-day checklist lives in [`PLAN.md`](PLAN.md).

| Week | Phase | Deliverable |
|---|---|---|
| 1 | Widget core | Embed loads on a real domain, themed, talks to the existing chat API |
| 2 | Workspace auth + branding admin | API keys, CORS allowlist, per-workspace theming |
| 3 | HTTP custom tools (workspace-scoped) | Admin can register endpoints, agent calls them |
| 4 | JWT verification + ctx-bound params + fitdistance pilot | Per-end-user identity. Marc chats with his programs. |
| 5 | Observability | Chat traces, retrieval visibility, conversation viewer in admin |
| 6 | UX/DX polish | Onboarding flow, empty states, error copy, against [`docs/UX-DX.md`](docs/UX-DX.md) |
| 7 | Pricing + landing | Stripe checkout, tier gates, public landing page |
| 8 | Sales push | 20 outreach messages, manual onboarding, retro and decision |

Pricing lands in week 7 on purpose. We make the product good before we charge for it.

## Out of scope for MVP

Cut from `ROADMAP.md` v1 or pushed to v1.5:

- CSV / JSON as a source type. Either it is a doc (text we ingest) or a tool (HTTP endpoint). No third path.
- OpenAPI auto-import for tools. Manual config form only in v1.
- Multi-channel (Slack, WhatsApp). Widget only.
- Tool versioning, replay, analytics. v1.5.
- Lead capture, human handoff. v1.5.
- Multi-region cloud deploy. One region.

When a beta customer asks for one of these, write it down. Do not build it.

## Working rules

Five rules across the eight weeks.

1. No new feature without a named user who asked for it. Fitdistance and the cold-outreach prospects in week 8 are named users.
2. One PR per box from `PLAN.md`, merged same day. Small PRs only.
3. Manual onboarding for the first three customers. No self-serve provisioning. You learn what is broken by doing it by hand.
4. Write down every friction point. Per customer, in their Notion doc. That list becomes the post-MVP backlog.
5. Stop building Friday of week 8. Look at the numbers. Decide what is next based on what customers said and did, not what we guessed.

## Done criteria

The MVP is done when all of these are true:

- A widget script tag works on at least one external domain (fitdistance counts).
- A workspace API key + CORS origin check prevents the same key from working on a different domain.
- An admin can register an HTTP custom tool and the agent calls it.
- A signed JWT from a host app passes a verified `user_id` into tool context. The LLM cannot override it.
- Conversation traces in the admin show retrieval scores, tool calls, and final answer for each chat turn.
- A Stripe checkout flips a workspace to `paid`.
- A hard 402 fires on unpaid workspaces over the free quota.
- At least one paying customer beyond fitdistance.

Three paying customers is the success bar. Less than three means the offer or the product is wrong.

## Where things live

- Long-arc roadmap: [`ROADMAP.md`](ROADMAP.md)
- Why we are doing this: [`docs/business-plan.md`](docs/business-plan.md)
- Day-by-day checklist: [`PLAN.md`](PLAN.md)
- Widget spec: [`docs/widget.md`](docs/widget.md)
- UX and DX bar: [`docs/UX-DX.md`](docs/UX-DX.md)
- Architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)
