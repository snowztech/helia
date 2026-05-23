import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Identity signing key. The plaintext shape is `helia_isk_<48 hex>`. The
 * `helia_isk_` prefix is purely for at-a-glance recognition (in logs, in
 * scanners, in a customer's env file). It does not affect verification.
 */
const SECRET_PREFIX = "helia_isk_";
const SECRET_BYTES = 24;

export function generateIdentitySecret(): string {
  return SECRET_PREFIX + randomBytes(SECRET_BYTES).toString("hex");
}

/**
 * HMAC-SHA256 over the canonical JSON of the user payload. Customers sign
 * the exact same string on their server. Hex output for portability across
 * stacks.
 */
export function signIdentity(
  user: { id: string; name?: string | null },
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(canonicalJson(user))
    .digest("hex");
}

export function verifyIdentity(
  user: { id: string; name?: string | null },
  signature: string,
  secret: string,
): boolean {
  const expected = signIdentity(user, secret);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Stable JSON: only known keys, fixed order. Same string on customer
 * server and Helia API, regardless of object key insertion order.
 */
function canonicalJson(user: { id: string; name?: string | null }): string {
  const obj: Record<string, string> = { id: user.id };
  if (user.name) obj.name = user.name;
  return JSON.stringify(obj);
}
