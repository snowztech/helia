# @gethelia/react

React wrapper for the Helia widget.

Use this package when the widget should live inside a React or Next.js app
shell. For static sites and CMS pages, copy the script tag from your Helia
admin instead.

## Install

```bash
pnpm add @gethelia/react
npm install @gethelia/react
```

## Basic Usage

```tsx
import { HeliaWidget } from "@gethelia/react";

export function AppShell() {
  return <HeliaWidget workspace="YOUR_WORKSPACE_ID" />;
}
```

## Next.js App Router

Render the widget from a client component:

```tsx
"use client";

import { HeliaWidget } from "@gethelia/react";

export function HeliaSupportWidget() {
  return <HeliaWidget workspace="YOUR_WORKSPACE_ID" />;
}
```

Then include that client component from your layout or app shell.

## Embedded Mode

Embedded mode renders a target container when no `target` is provided:

```tsx
<HeliaWidget
  workspace="YOUR_WORKSPACE_ID"
  mode="embedded"
  style={{ height: 600 }}
/>
```

If you already have a container, pass its selector:

```tsx
<div id="support-chat" style={{ height: 600 }} />
<HeliaWidget
  workspace="YOUR_WORKSPACE_ID"
  mode="embedded"
  target="#support-chat"
/>
```

## Signed Users

Use `@gethelia/server` in your backend to create a token endpoint, then pass it
to the widget:

```tsx
<HeliaWidget
  workspace="YOUR_WORKSPACE_ID"
  tokenEndpoint="/api/helia/token"
/>
```

The token endpoint is fetched with `credentials: "include"`, so your normal app
cookies are available to backend auth.

## Docs

Full install docs: https://gethelia.dev/docs
