# Helia SDKs

Helia still works with a plain script tag. The SDKs are for app teams that
want typed helpers in their backend and React UI.

## `@helia/server`

Use this in your backend token endpoint after your own auth has identified
the current user.

```ts
import { signIdentity } from "@helia/server";

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

## `@helia/react`

Use this when the host app is React/Next.js and you prefer a component over
managing the script tag.

```tsx
import { HeliaWidget } from "@helia/react";

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

## Retrieval Evals

Create a fixture with questions and expected source titles/URLs/chunk IDs,
then run:

```bash
pnpm --filter @helia/rag eval -- --workspace <workspace-uuid> --file evals/retrieval.example.json
```

The command exits non-zero when any case fails. Start with retrieval-only
evals before changing ranking, chunking, or adding rerankers.
