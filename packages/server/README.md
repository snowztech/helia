# @gethelia/server

Server helpers for signed Helia user identity.

Use this package when your product has logged-in users and Helia should know
who is chatting. Your backend signs the current user, and the widget sends that
signed identity with chat requests.

## Install

```bash
pnpm add @gethelia/server
npm install @gethelia/server
```

## Token Endpoint

Create a backend endpoint that runs after your own auth resolves the current
user. Return `signIdentity(...)` directly as JSON:

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

The response shape is:

```ts
{
  id: string;
  name?: string | null;
  signature: string;
}
```

Pass that endpoint to the widget:

```tsx
<HeliaWidget
  workspace="YOUR_WORKSPACE_ID"
  tokenEndpoint="/api/helia/token"
/>
```

Or with the script tag:

```html
<script
  src="https://your-helia-admin/w.js"
  data-workspace="YOUR_WORKSPACE_ID"
  data-token-endpoint="/api/helia/token"
  async
></script>
```

## Server-to-Server Headers

For direct API calls, use `identityHeaders(...)`:

```ts
import { identityHeaders } from "@gethelia/server";

const headers = identityHeaders(
  { id: "user_123", name: "Ada" },
  process.env.HELIA_IDENTITY_SECRET!,
);
```

## Docs

Full install docs: https://gethelia.dev/docs
