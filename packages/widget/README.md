# @gethelia/widget

Vanilla Helia widget runtime for script tag and non-React embeds.

Most users do not install this package directly. Copy the snippet from your
Helia admin Widget page instead.

```html
<script
  src="https://your-helia-admin/w.js"
  data-workspace="YOUR_WORKSPACE_ID"
  async
></script>
```

## Install

```bash
pnpm add @gethelia/widget
npm install @gethelia/widget
```

Use the package when you want to initialize the widget from JavaScript:

```ts
import Helia from "@gethelia/widget";

const widget = Helia.init({
  workspace: "YOUR_WORKSPACE_ID",
});

// Later, if needed:
widget.destroy();
```

## Embedded Mode

Embedded mode renders the chat into your own container. Give the container a
height or the widget will collapse.

```html
<div id="helia-chat" style="height: 600px"></div>
```

```ts
import Helia from "@gethelia/widget";

Helia.init({
  workspace: "YOUR_WORKSPACE_ID",
  mode: "embedded",
  target: "#helia-chat",
});
```

## Signed Users

When Helia should know the logged-in user, return a signed identity from your
backend and pass it to the widget:

```ts
Helia.identify({
  id: "user_123",
  name: "Ada",
  signature: "hmac-signature-from-your-server",
});
```

Use `@gethelia/server` to generate the signature.

## Docs

Full install docs: https://gethelia.dev/docs
