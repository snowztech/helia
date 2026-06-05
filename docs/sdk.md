# Helia SDKs

Helia still works with a plain script tag. The SDKs are for app teams that
want typed helpers in their backend and React UI.

## Hosted or self-hosted?

The integration model is the same in both cases.

| Helia deployment | What changes |
|------------------|--------------|
| Helia Cloud | Your admin and widget file live on `https://app.gethelia.dev` |
| Self-hosted Helia | Your admin and widget file live on your own Helia domain |

In normal setup, copy snippets from your Helia admin. The generated `w.js`
URL already points at the correct hosted or self-hosted origin.

## Install

Most websites do not install an npm package. Copy the script tag from your
Helia admin and paste it into the site.

For React or Next.js apps:

```bash
pnpm add @gethelia/react
npm install @gethelia/react
```

For backend identity endpoints:

```bash
pnpm add @gethelia/server
npm install @gethelia/server
```

Anonymous installs only need the workspace id. Authenticated installs add a
token endpoint that returns `{ id, name?, signature }`.

## `@gethelia/server`

Use this in your backend token endpoint after your own auth has identified
the current user.

```bash
pnpm add @gethelia/server
# npm install @gethelia/server
# yarn add @gethelia/server
```

```ts
import { signIdentity } from "@gethelia/server";

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  return Response.json(
    signIdentity(
      { id: user.id, name: user.name },
      process.env.HELIA_IDENTITY_SECRET!,
    ),
  );
}
```

The JSON response is `{ id, name?, signature }`, which the widget accepts
from `data-token-endpoint`.

For server-to-server calls, use `identityHeaders(identity, secret)` and
forward the returned `x-helia-user` and `x-helia-signature` headers.

## `@gethelia/react`

Use this when the host app is React/Next.js and you prefer a component over
managing the script tag.

```bash
pnpm add @gethelia/react
# npm install @gethelia/react
# yarn add @gethelia/react
```

```tsx
import { HeliaWidget } from "@gethelia/react";

export function AppShell() {
  return (
    <HeliaWidget
      workspace="00000000-0000-0000-0000-000000000000"
      tokenEndpoint="/api/helia-identity"
    />
  );
}
```

Embedded mode renders a target container when no `target` is provided:

```tsx
<HeliaWidget
  workspace="00000000-0000-0000-0000-000000000000"
  mode="embedded"
  style={{ height: 600 }}
/>
```

If you already have a container, pass its selector:

```tsx
<div id="support-chat" style={{ height: 600 }} />
<HeliaWidget workspace="..." mode="embedded" target="#support-chat" />
```

## Script tag with identity

Use the widget page for the anonymous snippet. When the host app has logged-in
users, add `data-token-endpoint`:

```html
<script
  src="https://your-helia-admin/w.js"
  data-workspace="00000000-0000-0000-0000-000000000000"
  data-token-endpoint="/api/helia-identity"
  async
></script>
```

The endpoint is called with `credentials: "include"`, so normal app cookies
are available to your backend auth.

## Production checklist

1. Add the host origin in Settings -> Embed allowlist.
2. Generate and store `HELIA_IDENTITY_SECRET` if using identity.
3. Deploy the token endpoint before enabling “Reject anonymous chats.”
4. Load a page with the widget and confirm `/v1/chat` has `x-helia-user` and
   `x-helia-signature` when signed in.
5. Turn on “Reject anonymous chats” only after signed users work.

## Retrieval Evals

Create a fixture with questions and expected source titles/URLs/chunk IDs,
then run:

```bash
pnpm --filter @helia/rag eval -- --workspace <workspace-uuid> --file evals/retrieval.example.json
```

The command exits non-zero when any case fails. Start with retrieval-only
evals before changing ranking, chunking, or adding rerankers.
