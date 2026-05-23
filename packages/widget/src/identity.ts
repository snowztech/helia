import type { Identity } from "./types";

/**
 * Module-singleton holding the current signed identity. Callers update it
 * via `Helia.identify(...)`; the widget reads it just before each chat
 * call. Re-identifying overwrites; `Helia.reset()` clears.
 */
let current: Identity | null = null;

export function setIdentity(identity: Identity): void {
  if (!identity.id || !identity.signature) {
    console.warn("[helia] identify() requires { id, signature }");
    return;
  }
  current = identity;
}

export function clearIdentity(): void {
  current = null;
}

export function getIdentity(): Identity | null {
  return current;
}

/**
 * Fetch a signed identity from the host's backend and apply it. Used when
 * the script tag declares `data-token-endpoint`. The endpoint should return
 * `{ id, name?, signature }` for the currently-authenticated user, or 401
 * if anonymous (we treat 401 as "no identity available" and stay quiet).
 */
export async function fetchAndSetIdentity(endpoint: string): Promise<void> {
  try {
    const res = await fetch(endpoint, { credentials: "include" });
    if (res.status === 401) return;
    if (!res.ok) {
      console.warn(
        `[helia] token endpoint ${endpoint} returned ${res.status}`,
      );
      return;
    }
    const data = (await res.json()) as Partial<Identity>;
    if (!data.id || !data.signature) {
      console.warn("[helia] token endpoint response missing id or signature");
      return;
    }
    const identity: Identity = { id: data.id, signature: data.signature };
    if (data.name) identity.name = data.name;
    setIdentity(identity);
  } catch (err) {
    console.warn("[helia] token endpoint fetch failed", err);
  }
}
