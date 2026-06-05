# Widget

The Helia widget is the script tag businesses drop on their site or inside their app to get the assistant. This document is the spec: how it embeds, how it is themed, how it talks to the API, and what it does not do.

The widget lives in `packages/widget`. See [`roadmap.md`](./roadmap.md) for what comes next.

## Design goals

- **One script tag.** No build step on the host site, no NPM install required for the common case.
- **No CSS collisions.** Host page styles must never affect the widget and vice versa.
- **Theming without code.** Branding is a config change in the admin UI, not a release.
- **Small.** Target under 30 KB gzipped for the loader, lazy-load the chat panel.
- **Two modes.** Public-site (anonymous) and dashboard (signed user token). Same widget, different init.

## Embedding

### The default snippet

```html
<script src="https://your-helia-admin/w.js" data-workspace="ws_xxx" async></script>
```

That's it. The loader fetches the workspace config from `/v1/widget/config?ws=ws_xxx`, mounts a launcher button in the corner, and lazy-loads the chat panel when the user opens it.

Embedded mode mounts the panel inside a page container instead of using the
floating launcher:

```html
<div id="helia-chat" style="height: 600px"></div>
<script
  src="https://your-helia-admin/w.js"
  data-workspace="ws_xxx"
  data-mode="embedded"
  data-target="#helia-chat"
  async
></script>
```

React apps can use `<HeliaWidget />`; backend identity helpers live in
`@gethelia/server`. See [`docs/sdk.md`](./sdk.md).

The config response includes the theme, the bot persona, the greeting, the allowed origin list, and the chat endpoint URL. It is cached on the CDN edge with stale-while-revalidate so theme changes propagate within seconds without the customer touching their HTML.

### React install

React and Next.js apps can install the wrapper package and render the same
widget through a component:

```tsx
import { HeliaWidget } from "@gethelia/react";

<HeliaWidget workspace="ws_xxx" />
```

Authenticated apps add a token endpoint:

```tsx
<HeliaWidget workspace="ws_xxx" tokenEndpoint="/api/helia/token" />
```

The token endpoint returns `{ id, name?, signature }`, signed with
`@gethelia/server`.

### Runtime config

The supported script/component config is intentionally small:

| Field | Purpose |
|-------|---------|
| `workspace` / `data-workspace` | Public workspace id |
| `apiUrl` / `data-api-url` | Override API origin for self-host/dev |
| `mode` / `data-mode` | `floating` or `embedded` |
| `target` / `data-target` | CSS selector for embedded mode |
| `tokenEndpoint` / `data-token-endpoint` | Host route returning a signed identity |

Branding, wording, position, theme, radius, suggestions, and avatar come
from the workspace config edited in the admin UI.

## Branding

What the workspace owner can change from the admin UI in v1.

| Field | What it controls |
|-------|------------------|
| Primary color | Header, send button, user message bubble |
| Bot avatar | Header icon and launcher mark |
| Bot name | Header title |
| Bot subtitle | Header subtitle |
| Greeting | First message shown when the panel opens |
| Placeholder | Input placeholder |
| Suggestions | First-message suggested questions |
| Position | bottom-right, bottom-left |
| Theme | light, dark, auto |
| Radius | Panel corner radius |

Seven fields cover what 80 percent of customers will ever ask for. We intentionally do not ship a full CSS editor or HTML templates in v1. That path leads to a support nightmare and we cap it at config.

## How theming works under the hood

Three rules.

1. The widget renders inside a Shadow Root attached to a single `<div id="helia-widget">`. Host page CSS cannot leak in. Widget CSS cannot leak out. This is non-negotiable for a "drop on any site" product.
2. Inside the shadow root, theme values are CSS custom properties on `:host`. The runtime injects them from the merged config (server + HTML attrs + JS API).
3. Live preview in the admin UI uses the same merged config. What the admin sees is what the visitor sees.

A simplified version of the shadow-root style block:

```css
:host {
  --helia-primary: #0ea5e9;
  --helia-background: #ffffff;
  --helia-text: #0b0b0b;
  --helia-radius: 12px;
  --helia-font: system-ui, sans-serif;
}
```

The widget components reference these variables only. Switching brand is a config write, no code change, no rebuild.

## Security

The widget is public surface area. A few rules keep it safe.

- **CORS allowlist per workspace.** The widget config endpoint and the chat endpoint both check the `Origin` header against the workspace's allowed domain list. A `ws_xxx` key on the wrong domain returns 403.
- **No secrets in the snippet.** The workspace ID is public on purpose. It is not a credential. Auth happens at the origin check.
- **Rate limit per visitor IP and per workspace.** Default token budget per workspace per day. Hard cap on per-IP request rate. Both configurable.
- **Signed identities in dashboard mode.** The host app exposes a token endpoint that returns `{ id, name?, signature }`. The signature is HMAC-SHA256 over the canonical user payload using the workspace identity secret. Helia verifies it on `/v1/chat` before attaching the user to the turn.
- **Tool outputs are untrusted.** Anything that comes back from a tool call is wrapped in a `<tool_result trust="low">` envelope in the prompt. The persona prompt tells the model that content inside that envelope is data, not instructions. Prevents indirect prompt injection through scraped pages and HTTP-tool responses.

## Performance targets

- Loader: under 30 KB gzipped.
- Time-to-launcher-visible: under 200 ms on a cable connection, lazy-loaded so it does not block the host page.
- Time-to-first-token on chat: under 1.5 s on `gpt-4o-mini` after the panel opens.
- Chat panel JS: lazy-loaded on first launcher click. Loader does not pay the cost upfront.

These numbers go in the CI bundle-size check once the package exists.

## Endpoints the widget calls

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/widget/config?ws=ws_xxx` | Theme, bot persona, allowed origin, chat URL. Cached at edge. |
| `POST` | `/v1/chat` | AI SDK data stream. Widget calls include `?ws=...`, `?conv=...`, and optional identity headers. |

The widget does not call source endpoints directly. Anything related to source management stays in the admin UI.

## What the widget does not do (in v1)

- It does not authenticate end users on the host site. The host app owns auth and only gives Helia a signed identity claim.
- It does not run custom JavaScript per workspace. Workspaces theme through config, not code.
- It does not work in iframes by default. We have not tested it there. If a customer needs it, we treat that as a real feature, not a hack.
- It does not support file upload from the visitor. Read-only conversation in v1.

## Build and ship

`@gethelia/widget` is the vanilla runtime package. `pnpm --filter @gethelia/widget
build` produces `dist/w.js`, which the web app copies to `apps/web/public/w.js`
during `@helia/web` builds.

`@gethelia/react` is a thin wrapper over the same runtime. It should not fork
chat behavior.
