# Business plan

What Helia is, who pays for it, how it makes money, and how we measure whether it is working.

## The product in one sentence

Open-source AI support agent. Small businesses upload their docs and optionally plug their own API in, then drop a script tag on their site or inside their app to get an assistant that answers from real content.

## Who buys it (ICP)

5–50 employee businesses that have a website and at least one existing web app or dashboard.

Concretely:

- SaaS startups handling their own support.
- E-commerce shops on Shopify or custom stacks.
- Agencies that resell "AI for clients."
- Internal IT or ops teams adding an assistant to an admin panel.

EU companies are an extra-warm target. Data residency is a real pain with US-only tools and we can solve it by self-host or EU hosted region.

Not the v1 target: solo creators, Fortune 500, anyone needing SOC2 on day one.

## Positioning

Four pillars, in priority order.

1. **Open.** AGPL license. Runs anywhere. No vendor lock.
2. **EU-ready.** Self-host on your infra or use our Frankfurt region. Mistral and Anthropic providers next to OpenAI.
3. **Agent, not just RAG.** The assistant calls tools and takes actions. Booking, lead capture, escalation, live data lookups.
4. **One Postgres.** No Redis, Pinecone, queue, or worker. Cheap to run, easy to operate.

We compete with Chatbase, Voiceflow, Intercom Fin, and custom-built bots. We do not compete on price.

## Pricing

| Tier | Price | What |
|------|-------|------|
| OSS self-host | free (AGPL) | All features. Community support. |
| Cloud Starter | €29 / month | 1 workspace, 2k messages, 50 sources, widget on 1 domain |
| Cloud Pro | €99 / month | 3 workspaces, 10k messages, 500 sources, custom HTTP tools, EU hosting, no powered-by badge |
| Cloud Scale | €299 / month | unlimited workspaces, 50k messages, SSO, audit log export |
| Enterprise | contact | self-host support, custom SLA, commercial license that escapes AGPL |

Margin logic. Self-host is free because AGPL pulls improvements back to the project. Cloud sells convenience and EU compliance, not extra features. Enterprise is the escape hatch for companies that cannot accept AGPL terms.

LLM tokens are pass-through to the customer's quota when self-hosting. On cloud we wrap usage with a 10 percent buffer baked into the tier.

## Distribution

How the first ten paying customers find us.

- **Building in public on dev.to.** Lucas writes a series. One post per shipped subsystem. Same cadence as Vikusha.
- **GitHub trending.** Push for stars on launch week. Open-source AI tooling trends well.
- **Show HN.** Different angle from ProductHunt. "Open-source Chatbase alternative, AGPL, runs on one Postgres."
- **ProductHunt launch.** Week 8 of v1.
- **Comparison content.** "Helia vs Chatbase," "self-hosting Helia on Fly in ten minutes." SEO long tail.
- **Direct outreach.** 50 cold emails to small SaaS founders in Lucas's network. Free six months in exchange for a case study.

## Roadmap dates

See [`ROADMAP.md`](../ROADMAP.md) for the canonical list. The short version:

- v1 by 2026-07-16. Public-site widget, multi-workspace, billing, hosted cloud.
- v1.5 by 2026-08-13. HTTP custom tools, authenticated dashboard mode, lead capture, human handoff.
- v2 driven by what the first paying customers ask for.

## Success metrics

Twelve weeks after the v1 launch we look at these numbers. If we are below the kill threshold on revenue, we change direction.

| Metric | Continue if | Kill if |
|--------|-------------|---------|
| GitHub stars | > 500 | < 100 |
| Self-host installs (pingable telemetry) | > 50 | < 10 |
| Paying cloud customers | ≥ 5 (≥ €150 MRR) | 0 |
| Weekly active workspaces on cloud | > 20 | < 5 |
| Avg messages / workspace / week | > 100 | < 10 |

Zero paying customers at week twelve means the story is wrong. We either pivot or stop. We do not keep building for ghosts.

## Costs

Monthly, at v1 scale (under 50 cloud workspaces).

- Neon Pro: ~€30
- Vercel Pro: ~€20
- Fly (API + workers if needed): ~€30
- Domain, email, Stripe fees: ~€30
- Lucas's time: the real cost, not counted here.

Break-even on infra is roughly five Cloud Starter customers. Anything above that is margin we put back into product.

## Risks and what we do about them

- **OpenAI raises prices.** Provider abstraction already exists in `@helia/agent`. Mistral fallback is part of v1.
- **AGPL scares some businesses.** Enterprise commercial license is in pricing from day one.
- **Chatbase undercuts on price.** We do not match. We sell EU, self-host, and open code.
- **We build features nobody uses.** Private beta of five hand-picked users before public launch. No new feature without a user asking.
- **Hosted infra outage during launch week.** Cloud runs in two regions from day one. Status page from week one. Self-host always available as a fallback.

## What this document is not

It is not a pitch deck and not a marketing site. It is the working plan that informs the roadmap. If reality changes, this file changes.
