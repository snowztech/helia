import { log } from "./state";

/**
 * Minimal email layer. If `RESEND_API_KEY` is set we POST to Resend;
 * otherwise we print the payload to stdout. Console fallback is what
 * makes self-host setup trivial — `make dev` shows the verification
 * link in the api logs, no SMTP required.
 *
 * Replace with a real provider abstraction (Postmark / SES / Mailgun) when
 * a customer asks. The call sites only use `sendVerificationEmail`.
 */

const FROM = process.env.HELIA_EMAIL_FROM ?? "Helia <no-reply@helia.local>";
const WEB_URL = (
  process.env.HELIA_WEB_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function send({ to, subject, text, html }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.info({ to, subject }, "email (console-only):\n" + text);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log.error(
        { status: res.status, body, to, subject },
        "email send failed",
      );
    }
  } catch (err) {
    log.error({ err, to, subject }, "email send threw");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetEmail(args: {
  to: string;
  token: string;
}): Promise<void> {
  const url = `${WEB_URL}/reset?token=${args.token}`;
  const safeUrl = escapeHtml(url);

  const text =
    `Someone (probably you) asked to reset your Helia password.\n\n` +
    `Reset it here:\n${url}\n\n` +
    `The link expires in 1 hour. If you didn't ask for this, ignore this email.`;

  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, system-ui, sans-serif; font-size: 14px; line-height: 1.5; color: #0f172a;">
    <p>Someone (probably you) asked to reset your Helia password.</p>
    <p>
      <a href="${safeUrl}" style="display: inline-block; padding: 10px 16px; background: #3a55e0; color: #fff; text-decoration: none; border-radius: 8px;">
        Reset password
      </a>
    </p>
    <p style="color: #475569;">Or paste this into your browser:</p>
    <p><a href="${safeUrl}">${safeUrl}</a></p>
    <p style="color: #475569; font-size: 12px;">
      The link expires in 1 hour. If you didn't ask for this, ignore this email.
    </p>
  </body>
</html>`;

  await send({
    to: args.to,
    subject: "Reset your Helia password",
    text,
    html,
  });
}

export async function sendVerificationEmail(args: {
  to: string;
  token: string;
}): Promise<void> {
  const url = `${WEB_URL}/verify?token=${args.token}`;
  const safeUrl = escapeHtml(url);

  const text =
    `Click to verify your email and finish signing up:\n\n${url}\n\n` +
    `The link expires in 24 hours.`;

  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, system-ui, sans-serif; font-size: 14px; line-height: 1.5; color: #0f172a;">
    <p>Click to verify your email and finish signing up:</p>
    <p>
      <a href="${safeUrl}" style="display: inline-block; padding: 10px 16px; background: #3a55e0; color: #fff; text-decoration: none; border-radius: 8px;">
        Verify email
      </a>
    </p>
    <p style="color: #475569;">Or paste this link into your browser:</p>
    <p><a href="${safeUrl}">${safeUrl}</a></p>
    <p style="color: #475569; font-size: 12px;">The link expires in 24 hours.</p>
  </body>
</html>`;

  await send({
    to: args.to,
    subject: "Verify your Helia email",
    text,
    html,
  });
}
