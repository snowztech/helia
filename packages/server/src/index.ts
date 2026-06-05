import { createHmac, timingSafeEqual } from "node:crypto";

export type HeliaIdentity = {
  id: string;
  name?: string | null;
};

export type SignedHeliaIdentity = HeliaIdentity & {
  signature: string;
};

export type HeliaIdentityHeaders = {
  "x-helia-user": string;
  "x-helia-signature": string;
};

/**
 * Sign an authenticated end-user for Helia's widget/API.
 *
 * Return this directly from a token endpoint as JSON:
 * `{ id, name?, signature }`.
 */
export function signIdentity(
  identity: HeliaIdentity,
  secret: string,
): SignedHeliaIdentity {
  assertIdentity(identity);
  const signature = signatureFor(identity, secret);
  return identity.name
    ? { id: identity.id, name: identity.name, signature }
    : { id: identity.id, signature };
}

/**
 * Build the headers expected by /v1/chat for server-to-server calls.
 */
export function identityHeaders(
  identity: HeliaIdentity,
  secret: string,
): HeliaIdentityHeaders {
  const signed = signIdentity(identity, secret);
  const user =
    signed.name === undefined
      ? { id: signed.id }
      : { id: signed.id, name: signed.name };
  return {
    "x-helia-user": JSON.stringify(user),
    "x-helia-signature": signed.signature,
  };
}

export function verifyIdentity(
  identity: HeliaIdentity,
  signature: string,
  secret: string,
): boolean {
  assertIdentity(identity);
  const expected = signatureFor(identity, secret);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function signatureFor(identity: HeliaIdentity, secret: string): string {
  if (!secret) throw new Error("Helia identity secret is required");
  return createHmac("sha256", secret)
    .update(canonicalJson(identity))
    .digest("hex");
}

function canonicalJson(identity: HeliaIdentity): string {
  const obj: Record<string, string> = { id: identity.id };
  if (identity.name) obj.name = identity.name;
  return JSON.stringify(obj);
}

function assertIdentity(identity: HeliaIdentity): void {
  if (!identity || typeof identity.id !== "string" || identity.id.length === 0) {
    throw new Error("Helia identity requires a non-empty string id");
  }
}
