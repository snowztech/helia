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
}

async function send({ to, subject, text }: SendArgs): Promise<void> {
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
      body: JSON.stringify({ from: FROM, to, subject, text }),
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

export async function sendVerificationEmail(args: {
  to: string;
  token: string;
}): Promise<void> {
  const url = `${WEB_URL}/verify?token=${args.token}`;
  await send({
    to: args.to,
    subject: "Verify your Helia email",
    text:
      `Click to verify your email and finish signing up:\n\n${url}\n\n` +
      `The link expires in 24 hours.`,
  });
}
