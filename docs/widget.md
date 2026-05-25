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
<script src="https://app.gethelia.dev/w.js" data-workspace="ws_xxx" async></script>
```

That's it. The loader fetches the workspace config from `/v1/widget/config?ws=ws_xxx`, mounts a launcher button in the corner, and lazy-loads the chat panel when the user opens it.

The config response includes the theme, the bot persona, the greeting, the allowed origin list, and the chat endpoint URL. It is cached on the CDN edge with stale-while-revalidate so theme changes propagate within seconds without the customer touching their HTML.

### HTML overrides

For agencies or power users who want to override one or two values without going to the admin UI:

```html
<script src="https://app.gethelia.dev/w.js"
        data-workspace="ws_xxx"
        data-primary="#0ea5e9"
        data-position="left"
        async></script>
```

Supported data attributes: `data-primary`, `data-position`, `data-greeting`, `data-launcher-text`, `data-tone`.

### Full JS API

For dashboards where the host app already has design tokens and an auth session:

```js
window.Helia.init({
  workspace: 'ws_xxx',
  userToken: '<signed JWT>',           // dashboard mode only
  theme: {
    primary: '#0ea5e9',
    background: '#0b0b0b',
    text: '#fafafa',
    radius: '12px',
    logo: '/img/bot.svg',
    font: 'inherit',
  },
  bot: { name: 'Pedro', greeting: 'Hi, I am Pedro from FistDistance.' },
  launcher: { position: 'bottom-right', shape: 'pill' },
  tone: 'auto',
});
```

Anything passed here wins over the server config for that page load. The server config remains the default for everyone else.

## Branding

What the workspace owner can change from the admin UI in v1.

| Field | What it controls |
|-------|------------------|
| Primary color | Header, send button, user message bubble |
| Background color | Panel and message area |
| Text color | All copy in the panel |
| Logo | Header icon and bot avatar |
| Bot name | Header title and message-from label |
| Greeting | First message shown when the panel opens |
| Launcher position | bottom-right, bottom-left |
| Launcher shape | circle or pill |
| Launcher icon | default chat bubble or uploaded SVG |
| Tone | light, dark, auto (follows `prefers-color-scheme`) |
| Font | system default or `inherit` from the host page |
| Powered-by badge | shown on Starter, hideable on Pro and above |

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
- **Signed user tokens in dashboard mode.** The host app signs a short-lived JWT with its private key. Helia verifies it with the workspace's public key (registered at setup). The agent gets a verified `user_id` and `role` in `ctx`. Tools may use these. The LLM cannot forge them.
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
| `POST` | `/v1/chat` | SSE stream. Same endpoint the admin chat page uses. Auth differs (workspace API key + Origin check instead of session). |

The widget does not call source endpoints directly. Anything related to source management stays in the admin UI.

## What the widget does not do (in v1)

- It does not authenticate end users on the host site. That is v1.5 (dashboard mode with signed JWT).
- It does not run custom JavaScript per workspace. Workspaces theme through config, not code.
- It does not work in iframes by default. We have not tested it there. If a customer needs it, we treat that as a real feature, not a hack.
- It does not support file upload from the visitor. Read-only conversation in v1.

## Build and ship

The widget package is published to npm as `@helia/widget` and served as a static asset at `https://app.gethelia.dev/w.js`. The served file is the immutable, versioned build. A separate `https://app.gethelia.dev/w.js` pointer lets customers pin a version if they want.

`pnpm --filter @helia/widget build` produces the loader and the panel bundles. CI runs the bundle-size check, the cross-browser smoke test, and the visual snapshot of the default theme.

## Open questions

These are decided when we get to them, not before.

- Do we ship a React component wrapper next to the script tag? Probably yes once we have a paying customer who asks. Same widget, just a thin component.
- Do we expose a "send message programmatically" API for chained UX flows? Wait until v1.5 dashboard mode lands and see if anyone needs it.
- Do we support multiple widgets on the same page? Not in v1. The widget assumes one instance per page.
