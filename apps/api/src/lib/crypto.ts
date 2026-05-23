import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

/**
 * AES-256-GCM at rest for customer-issued secrets (HMAC keys, future
 * tool-header secrets, etc.). The wire format is a single base64 string:
 *
 *   v1.<iv_b64>.<auth_tag_b64>.<ciphertext_b64>
 *
 * The "v1" prefix lets us migrate algorithms later without ambiguity.
 *
 * The key derives from MASTER_KEY (32-byte hex). MASTER_KEY rotation is a
 * future Sprint 4 concern: we'd add v2 with a key id and decrypt-then-
 * re-encrypt on read.
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";

function key(): Buffer {
  const raw = process.env.MASTER_KEY;
  if (!raw) throw new Error("MASTER_KEY not set");
  // Accept hex (preferred, 64 chars) or a passphrase (hash it).
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  return createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(".");
}

export function decrypt(blob: string): string {
  const parts = blob.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("invalid ciphertext");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv(
    ALGO,
    key(),
    Buffer.from(ivB64!, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(ctB64!, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
