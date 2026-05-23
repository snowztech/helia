import { encrypt, decrypt } from "./crypto";

/**
 * Tool header values are encrypted at rest. The stored value is the
 * `v1.<iv>.<tag>.<ct>` envelope produced by `crypto.encrypt`. This
 * module is the single place that knows about that shape — call sites
 * stay readable.
 *
 * The plaintext sentinel `__keep__` is used by the admin form: when the
 * UI shows a masked header and the user doesn't touch it, the form
 * resubmits `__keep__`, and we leave the stored ciphertext alone.
 */

const KEEP = "__keep__";

export function isEncrypted(value: string): boolean {
  return value.startsWith("v1.");
}

export function encryptHeaders(
  next: Record<string, string>,
  previous: Record<string, string> | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(next)) {
    if (value === KEEP) {
      const kept = previous?.[name];
      if (kept) out[name] = kept;
      continue;
    }
    if (value === "") continue; // dropped by the user
    out[name] = isEncrypted(value) ? value : encrypt(value);
  }
  return out;
}

export function decryptHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    out[name] = isEncrypted(value) ? decrypt(value) : value;
  }
  return out;
}

/**
 * Public-facing shape: name plus a "set" boolean so the UI knows there's
 * a stored value to preserve, without ever leaking ciphertext OR plaintext.
 */
export function maskHeaders(
  headers: Record<string, string>,
): Record<string, { set: true }> {
  const out: Record<string, { set: true }> = {};
  for (const name of Object.keys(headers)) {
    out[name] = { set: true };
  }
  return out;
}
