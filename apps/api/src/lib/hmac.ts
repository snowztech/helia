import { randomBytes } from "node:crypto";
import {
  signIdentity as signHeliaIdentity,
  verifyIdentity,
  type HeliaIdentity,
} from "@gethelia/server";

export { verifyIdentity };

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

export function signIdentity(
  user: HeliaIdentity,
  secret: string,
): string {
  return signHeliaIdentity(user, secret).signature;
}
