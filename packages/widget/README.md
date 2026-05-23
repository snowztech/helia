# @helia/widget

The embeddable chat widget. Pure TypeScript (no React), bundled to a single
IIFE script by esbuild. Customers drop one `<script>` tag on their site.

## Install snippet

```html
<script src="https://helia.snowztech.com/w.js" data-workspace="ws_xxx" async></script>
```

Optional attributes:

- `data-api-url` — point the widget at a different API (useful in dev).
- `data-bot-name`, `data-greeting` — override the workspace defaults
  for this page only (most users set these in the admin and skip these).

## How it works

1. The script tag auto-mounts on `DOMContentLoaded` (see `src/index.ts`).
2. The widget creates a host element, attaches a Shadow Root, and renders
   the launcher + panel inside it. Shadow DOM means host page CSS cannot
   leak in or out.
3. On mount, the widget fetches `/v1/widget/config?ws=…` and applies the
   workspace's brand color, bot name, subtitle, greeting, placeholder,
   suggested questions, position, theme, and corner radius.
4. On send, the widget POSTs to `/v1/chat` and consumes the Vercel AI SDK
   v4 data stream (text deltas, tool calls, tool results, errors).
5. Tool calls render as inline pills while the agent works. Citations
   appear under the answer if `search_knowledge` was used.

## Files

```
src/
├── index.ts    auto-mount + window.Helia.init() API
├── widget.ts   shadow DOM mount, panel UI, send loop, state
├── stream.ts   AI SDK v4 data-stream parser (text, tools, errors)
├── styles.ts   all CSS for the shadow root, themed via custom properties
├── config.ts   fetch + type the remote workspace config
└── types.ts    WidgetConfig, ChatMessage, WidgetHandle
```

## Build

```bash
pnpm --filter @helia/widget build   # one-shot, minified bundle in dist/
pnpm --filter @helia/widget dev     # esbuild --servedir on port 5173
```

The bundle target is `<30 KB minified`. Current size: ~20 KB.

## Testing locally

```bash
make dev   # starts api (4000) + admin (3000) + widget (5173) in parallel
```

Open http://localhost:5173/test.html — the launcher should appear in the
bottom-right corner, the API on port 4000 should be reachable, and CORS
is auto-permissive on any `localhost:*` origin in dev.
