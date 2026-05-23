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
