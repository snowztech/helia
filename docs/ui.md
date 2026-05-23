# UI

ASCII mockups of every screen in the app. Lo-fi on purpose. The point is shape and flow, not pixels. Real design happens in code with shadcn primitives and the [`UX-DX.md`](UX-DX.md) bar.

Three surfaces:

1. **Landing** at `helia.snowztech.com` — public marketing page.
2. **Admin** at `helia.snowztech.com/app` — workspace owner manages sources, tools, branding, billing.
3. **Widget** — what the end user sees on the customer's site.

## Landing page

One page. No nav menu in v1.

```
┌─────────────────────────────────────────────────────────────────┐
│  helia                                       Docs   Sign in     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│      The simplest way to give your business its own AI.         │
│      Upload your docs. Plug in your data. Drop one script tag.  │
│                                                                 │
│      [  Start free  ]    [  Watch 90s demo  ]                   │
│                                                                 │
│      ─────────── trusted by ──────────                          │
│      fitdistance    [logo]    [logo]    [logo]                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Your docs.            Your data.           Your brand.        │
│   ┌──────────┐          ┌──────────┐         ┌──────────┐       │
│   │ PDF . URL│          │ HTTP API │         │ Colors   │       │
│   │ Text     │          │ Tools    │         │ Logo     │       │
│   │          │          │          │         │ Bot name │       │
│   └──────────┘          └──────────┘         └──────────┘       │
│   Drop a PDF or         Register your        Make it look       │
│   crawl your site.      endpoint. Agent      like yours.        │
│                         calls it live.                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    [ embedded 90s demo video ]                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Pricing                                                       │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │   Free       │   │   Pro €99    │   │  Enterprise  │        │
│   │              │   │              │   │              │        │
│   │ 1 workspace  │   │ 3 workspaces │   │ Self-host    │        │
│   │ 200 msg/mo   │   │ 10k msg/mo   │   │ Custom SLA   │        │
│   │ Docs only    │   │ HTTP tools   │   │ Commercial   │        │
│   │              │   │ No brand     │   │ license      │        │
│   │ [ Start ]    │   │ [ Start ]    │   │ [ Talk ]     │        │
│   └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Open source. AGPL.   github.com/snowztech/helia               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Notes:
- Hero CTA is "Start free." No friction. Email magic link in.
- "Trusted by" with fitdistance logo on day one. Add more as customers come.
- Demo video is the conversion driver. Two minutes max.
- Pricing is honest. No "contact sales" gate on Pro.

## Sign in / sign up

One screen, magic link.

```
┌─────────────────────────────────────────────────────────────────┐
│                              helia                              │
│                                                                 │
│              Sign in or create an account                       │
│                                                                 │
│        ┌──────────────────────────────────────────┐             │
│        │  email@yourcompany.com                   │             │
│        └──────────────────────────────────────────┘             │
│                                                                 │
│        [        Send me a magic link             ]              │
│                                                                 │
│        No password. We email you a one-click link.              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## First-run onboarding

Three-step modal after first sign-in. Cannot be skipped on day one. Skipped automatically forever after.

### Step 1 — Name your assistant

```
┌─────────────────────────────────────────────────────────────────┐
│   Step 1 of 3                                          Skip →   │
│                                                                 │
│   Name your assistant and pick a color.                         │
│                                                                 │
│   Bot name                                                      │
│   ┌──────────────────────────────────────────┐                  │
│   │ Marie                                    │                  │
│   └──────────────────────────────────────────┘                  │
│                                                                 │
│   Brand color                                                   │
│   ●  ●  ●  ●  ●  ●  ●  ●     or  #0ea5e9                        │
│                                                                 │
│   Greeting                                                      │
│   ┌──────────────────────────────────────────┐                  │
│   │ Hi, I'm Marie. How can I help?           │                  │
│   └──────────────────────────────────────────┘                  │
│                                                                 │
│                              [  Continue →  ]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2 — Add a source

```
┌─────────────────────────────────────────────────────────────────┐
│   Step 2 of 3                                          Skip →   │
│                                                                 │
│   Give Marie something to learn from.                           │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │   PDF       │  │   URL       │  │   Text      │             │
│   │             │  │             │  │             │             │
│   │ Drop a file │  │ Crawl a     │  │ Paste any   │             │
│   │ here        │  │ website     │  │ content     │             │
│   └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│   You can add more sources later. Add at least one to continue. │
│                                                                 │
│                              [  Continue →  ]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3 — Install

```
┌─────────────────────────────────────────────────────────────────┐
│   Step 3 of 3                                                   │
│                                                                 │
│   Drop this snippet on your site.                               │
│                                                                 │
│   ┌──────────────────────────────────────────────────┐  📋     │
│   │ <script src="https://helia.snowztech.com/w.js"   │          │
│   │         data-workspace="ws_a4f9c2"               │          │
│   │         async></script>                          │          │
│   └──────────────────────────────────────────────────┘          │
│                                                                 │
│   Try it on this page:                                          │
│                                                                 │
│   ┌──────────────────────────────────────────────────┐          │
│   │                                                  │          │
│   │     [ live preview of Marie on a sandbox page ]  │          │
│   │                                                  │          │
│   └──────────────────────────────────────────────────┘          │
│                                                                 │
│                              [  Go to dashboard  ]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Admin shell

After onboarding, every page sits in this shell.

```
┌─────────────────────────────────────────────────────────────────────┐
│  helia    [Workspace: fitdistance ▾]      [usage 3,421/10k]  lucas ▾│
├─────────┬───────────────────────────────────────────────────────────┤
│         │                                                           │
│ Sources │                                                           │
│ Tools   │                  [ page content ]                         │
│ Chat    │                                                           │
│ Convos  │                                                           │
│ Brand   │                                                           │
│ Install │                                                           │
│ Settings│                                                           │
│ Billing │                                                           │
│         │                                                           │
└─────────┴───────────────────────────────────────────────────────────┘
```

- Top bar: logo, workspace switcher, usage meter, user menu.
- Left rail: eight items. Always visible on desktop. Collapses on tablet.
- Top-right "usage" meter is a real number. Tooltip shows reset date and tier.

## Sources page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sources                                            [ + Add source ]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ Coaching playbook 2025.pdf       PDF    ✓ Indexed   42 chunks│   │
│   │ Added by lucas · 2 days ago                                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ fitdistance.com                  URL    ⟳ Crawling 31/120   │   │
│   │ Started 4 min ago                                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ Onboarding email template        Text   ✗ Failed            │   │
│   │ Embed quota exceeded. [ Retry ]                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Empty state replaces the list when there are no sources:

```
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   │                      No sources yet                         │
   │                                                             │
   │     Give Marie something to learn from to get started.      │
   │                                                             │
   │      [ Upload PDF ]   [ Crawl URL ]   [ Paste text ]        │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
```

## Source detail

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Sources                                                          │
│                                                                     │
│  fitdistance.com                                            [ ⋮ ]   │
│  URL · Started 4 min ago · 31 of 120 pages indexed                  │
│                                                                     │
│  Timeline                                                           │
│   14:32  Started crawl from fitdistance.com                         │
│   14:32  Discovered 120 pages                                       │
│   14:33  Extracted page 1: "Coaching programs"                      │
│   14:33  Extracted page 2: "Pricing"                                │
│   ...                                                               │
│   14:36  Embedded batch 3 (64 chunks)                               │
│   14:38  ⟳ In progress...                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Tools page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tools                                              [ + Add tool ]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Custom HTTP tools the agent can call during a chat.               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ search_programs           ✓ Enabled    coach_id from JWT    │   │
│   │ Search a coach's training programs                          │   │
│   │ POST  https://api.fitdistance.com/ai/search_programs        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ get_athlete_stats         ✓ Enabled    coach_id from JWT    │   │
│   │ Return stats for the coach's athletes                       │   │
│   │ POST  https://api.fitdistance.com/ai/athlete_stats          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Add / edit tool form:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Tools                                                            │
│                                                                     │
│  New tool                                                           │
│                                                                     │
│  Name                                                               │
│  ┌───────────────────────────────────┐                              │
│  │ search_programs                   │                              │
│  └───────────────────────────────────┘                              │
│                                                                     │
│  Description (shown to the agent)                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Search a coach's training programs by name or athlete.        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Endpoint                                                           │
│  POST ▾  ┌────────────────────────────────────────────────────┐    │
│           │ https://api.fitdistance.com/ai/search_programs    │    │
│           └────────────────────────────────────────────────────┘    │
│                                                                     │
│  Outbound header (optional)                                         │
│  Authorization  ┌────────────────────┐                              │
│                  │ Bearer sk-•••••••• │  [ Rotate ]                 │
│                  └────────────────────┘                             │
│                                                                     │
│  Parameters                                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ name        type    source         description              │    │
│  │ coach_id    string  ✓ Context      Coach id from JWT        │    │
│  │ query       string  ✓ LLM          Search query             │    │
│  │ [ + Add parameter ]                                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Limits                                                             │
│  Timeout  ┌──────┐ ms     Max response  ┌──────┐ KB                │
│           │ 10000 │                       │ 100  │                  │
│           └──────┘                       └──────┘                   │
│                                                                     │
│                                  [ Cancel ]  [ Save tool ]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Key bit: the **source** column on parameters. "Context" means the param comes from the verified JWT and the LLM cannot see or set it.

## Chat (admin testing)

A page to test the agent without embedding the widget.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Chat                                            [ Test as: lucas ▾]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Marie                                                             │
│   Hi, I'm Marie. How can I help?                                    │
│                                                                     │
│   You                                                               │
│   What programs do I have for runners?                              │
│                                                                     │
│   Marie                          🔧 search_programs                  │
│   I found 4 programs for runners:                                   │
│   1. Couch to 5K — 8 weeks                                          │
│   2. Marathon prep — 16 weeks                                       │
│   3. Trail beginner — 6 weeks                                       │
│   4. Speed work — 4 weeks                                           │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐ →  │
│   │ Ask Marie...                                              │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The 🔧 chip is clickable. Opens the trace for that tool call inline.

## Conversations (observability)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Conversations                                  [ Filter: All ▾ ]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ⓘ All chats end up here. Click one to see the full trace.        │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │ 14:42  marc@fitdistance     "what programs do I have..."  │    │
│   │        4 steps · 2.1s · 1,420 tokens · €0.003             │    │
│   └───────────────────────────────────────────────────────────┘    │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │ 14:35  anonymous            "what are your hours?"        │    │
│   │        2 steps · 0.8s · 320 tokens · €0.001               │    │
│   └───────────────────────────────────────────────────────────┘    │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │ 14:21  marc@fitdistance     "show all athletes"   ⚠ error │    │
│   │        3 steps · 1.3s · 480 tokens · tool timeout         │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Conversation detail view:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Conversations                                                    │
│                                                                     │
│  marc@fitdistance · 14:42 · 2.1s · 1,420 tokens          [ Replay ] │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ User                                                          │  │
│  │ what programs do I have for runners?                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Steps                                                              │
│   1. ⏵ LLM call                          gpt-4o-mini · 320ms · 480t │
│      "Calling search_programs for runners..."                       │
│                                                                     │
│   2. 🔧 search_programs                  fitdistance · 410ms        │
│      args: { query: "runners", coach_id: 12345 [from ctx] }         │
│      result: 4 programs ▾                                           │
│                                                                     │
│   3. ⏵ LLM call                          gpt-4o-mini · 1.2s · 940t  │
│      Final answer streamed below                                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Answer                                                        │  │
│  │ I found 4 programs for runners: ...                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Retrieval                                                          │
│   No documents retrieved (tool answered)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

If the agent used `search_knowledge`, the Retrieval section expands with per-chunk scores:

```
   ┌─ Retrieval (search_knowledge) ──────────────────────────────┐
   │  Query: "runners programs"                                  │
   │                                                             │
   │  1. Marathon prep playbook · page 12      RRF 0.029         │
   │     vector 0.84   fts 0.61                                  │
   │     "...for runners we recommend a 16-week..."              │
   │                                                             │
   │  2. Trail beginner program · page 3       RRF 0.023         │
   │     vector 0.78   fts 0.55                                  │
   │     "...beginner trail runners..."                          │
   └─────────────────────────────────────────────────────────────┘
```

## Brand (widget theme)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Brand                                                              │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                      │
│  Bot name                    │              ┌─────────────┐         │
│  ┌────────────────────────┐  │              │             │         │
│  │ Marie                  │  │              │   [Marie]   │         │
│  └────────────────────────┘  │              │  Hi, I'm    │         │
│                              │              │  Marie...   │         │
│  Greeting                    │              │             │         │
│  ┌────────────────────────┐  │              │             │         │
│  │ Hi, I'm Marie...       │  │              │             │         │
│  └────────────────────────┘  │              │             │         │
│                              │              │             │         │
│  Primary color               │              │             │         │
│  ●●●●●●●●  #0ea5e9           │              │             │         │
│                              │              │             │         │
│  Background                  │              │             │         │
│  ●●  light  ●  dark  ● auto  │              │             │         │
│                              │              │             │         │
│  Logo                        │              │             │         │
│  [ upload SVG/PNG ]          │              │             │         │
│                              │              │             │         │
│  Launcher                    │              │             │         │
│  ◉ bottom-right              │              │  [ ●  Send] │         │
│  ○ bottom-left               │              └─────────────┘         │
│                              │            live preview              │
│  Powered-by Helia            │                                      │
│  [✓ Show]  (Pro to hide)     │                                      │
│                              │                                      │
│         [ Save changes ]     │                                      │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

Live preview updates as the form changes. Real widget mounted in an iframe on the right.

## Install

```
┌─────────────────────────────────────────────────────────────────────┐
│  Install                                                            │
│                                                                     │
│  Drop this on any page.                                             │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  📋│
│  │ <script src="https://helia.snowztech.com/w.js"             │     │
│  │         data-workspace="ws_a4f9c2"                         │     │
│  │         async></script>                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Allowed domains                                                    │
│  fitdistance.com  ×    app.fitdistance.com  ×                       │
│  ┌────────────────────────┐                                         │
│  │ Add a domain...        │ [ + ]                                   │
│  └────────────────────────┘                                         │
│  Only these domains can use this widget. Wildcards not supported.   │
│                                                                     │
│  ─────────  Per-user identity (optional)  ─────────                 │
│                                                                     │
│  Paste your JWT public key. Helia verifies tokens from your app     │
│  so tools can scope to the logged-in user. Docs ↗                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ -----BEGIN PUBLIC KEY-----                                 │     │
│  │ MIIBIj...                                                  │     │
│  │ -----END PUBLIC KEY-----                                   │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Issuer    ┌──────────────────┐   Audience  ┌──────────────────┐   │
│            │ fitdistance.com  │              │ helia            │   │
│            └──────────────────┘              └──────────────────┘   │
│                                                                     │
│                                            [ Save ]                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Settings

Boring but necessary. Workspace name, locale, default LLM provider and model.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings                                                           │
│                                                                     │
│  Workspace name                                                     │
│  ┌──────────────────────────────────────────┐                       │
│  │ fitdistance                              │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                     │
│  Locale                                                             │
│  [ English ▾ ]                                                      │
│                                                                     │
│  Model                                                              │
│  Provider [ OpenAI ▾ ]   Model [ gpt-4o-mini ▾ ]                    │
│                                                                     │
│  ─────────  Members  ─────────                                      │
│  lucas@snowztech.com         Owner       (you)                      │
│  marc@fitdistance.com        Admin       [ Remove ]                 │
│  [ Invite a teammate ]                                              │
│                                                                     │
│  ─────────  Danger zone  ─────────                                  │
│  [ Delete workspace ]                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Billing

```
┌─────────────────────────────────────────────────────────────────────┐
│  Billing                                                            │
│                                                                     │
│  Current plan        Pro · €99 / month                              │
│  Next invoice        2026-08-20 · €99.00                            │
│                                                                     │
│  This month                                                         │
│   ████████░░░░░░░░░░░  3,421 / 10,000 messages                      │
│   €4.12 in LLM costs (covered by your plan)                         │
│                                                                     │
│  [ Manage subscription on Stripe ]   [ Download invoices ]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## The widget itself

What an end user sees.

### Closed (launcher only)

```
                                                           ┌──────┐
                                                           │  ●●  │
                                                           └──────┘
```

A circular button in the bottom-right corner of the host page. Theme-colored. Logo if uploaded.

### Open — first message

```
                          ┌─────────────────────────────────┐
                          │  Marie                       ✕  │
                          ├─────────────────────────────────┤
                          │                                 │
                          │  Hi, I'm Marie. How can I help? │
                          │                                 │
                          │                                 │
                          │                                 │
                          ├─────────────────────────────────┤
                          │  Ask Marie...                ▸ │
                          └─────────────────────────────────┘
                          powered by helia
```

Header uses the workspace primary color. Bot name + greeting from config.

### Open — mid conversation

```
                          ┌─────────────────────────────────┐
                          │  Marie                       ✕  │
                          ├─────────────────────────────────┤
                          │                                 │
                          │  Hi, I'm Marie. How can I help? │
                          │                                 │
                          │            What programs do I  ▎│
                          │            have for runners?   ▎│
                          │                                 │
                          │  🔧 looking that up...           │
                          │                                 │
                          │  I found 4 programs:            │
                          │  • Couch to 5K                  │
                          │  • Marathon prep                │
                          │  • Trail beginner               │
                          │  • Speed work                   │
                          │                                 │
                          │  Sources: 2 documents ⓘ          │
                          ├─────────────────────────────────┤
                          │  Ask Marie...                ▸ │
                          └─────────────────────────────────┘
```

The 🔧 chip during tool calls shows the agent is working. Replaced by the answer when it streams in.
Citations chip at the bottom of an answer expands to show the source docs that were retrieved.

### Open on mobile

```
                          ┌────────────────────────────────┐
                          │                                │
                          │                                │
                          │                                │
                          │      [ host page is dimmed ]   │
                          │                                │
                          ├────────────────────────────────┤
                          │  Marie                      ✕  │
                          │ ───────────────────────────────│
                          │  Hi, I'm Marie. How can       │
                          │  I help?                       │
                          │                                │
                          │                                │
                          │                                │
                          │  Ask Marie...               ▸ │
                          └────────────────────────────────┘
```

Bottom sheet on phones. Full screen on small viewports.

## How the screens connect

```
                            Landing (helia.snowztech.com)
                                  │
                                  ▼
                            Sign in (magic link)
                                  │
                                  ▼
                         Onboarding 3 steps (first time only)
                                  │
                                  ▼
                            ┌────────────┐
                            │  Sources   │ ◄── default page
                            └────────────┘
                                  │
              ┌────────┬──────────┼──────────┬─────────┬────────┐
              ▼        ▼          ▼          ▼         ▼        ▼
            Tools    Chat      Convos      Brand    Install   Settings
                                                                  │
                                                                  ▼
                                                              Billing
```

## What we are not designing in v1

- Mobile-native admin (tablet is fine, phone shows a "best viewed on desktop" notice).
- Light theme switching beyond `prefers-color-scheme`. Auto only.
- Public-facing roadmap / status pages on `helia.snowztech.com`.
- A dashboard with charts. Conversations + Billing have the only numbers we show.
- Multi-language admin. English-only on the chrome. The bot can answer in any language.

These come back in v1.5 or v2 if customers ask.
