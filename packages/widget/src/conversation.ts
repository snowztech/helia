/**
 * One conversation id per browser tab, lasting until the tab closes
 * (sessionStorage scope). Same tab = same conversation, so the agent gets
 * continuity across reloads. New tab / new browser = fresh conversation,
 * which matches a user's mental model of "starting over".
 *
 * Stored under a workspace-scoped key so multiple Helia widgets on the
 * same site (rare, but possible) don't collide.
 */
const KEY_PREFIX = "helia.conversation.";

export function getOrCreateConversationId(workspace: string): string {
  const key = KEY_PREFIX + workspace;
  if (typeof window === "undefined" || !window.sessionStorage) {
    return uuid();
  }
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing && isUuid(existing)) return existing;
    const fresh = uuid();
    window.sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return uuid();
  }
}

/**
 * Forget the current conversation id. Next call to
 * `getOrCreateConversationId` mints a fresh one.
 */
export function resetConversationId(workspace: string): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(KEY_PREFIX + workspace);
  } catch {
    // Storage disabled — next read returns a fresh id anyway.
  }
}

function uuid(): string {
  const g = globalThis as { crypto?: Crypto };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  // RFC 4122 v4 fallback for older browsers.
  const bytes = new Uint8Array(16);
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}
