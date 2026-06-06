import { createHmac, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { workspaces, type Workspace } from "@helia/db";
import { currentUser, currentWorkspace } from "../lib/auth";
import {
  billingConfigured,
  db,
  FREE_TOKEN_QUOTA,
  HELIA_MODE,
  STARTER_TOKEN_QUOTA,
} from "../lib/state";

export const billingRouter = new Hono();

type BillingStatus = "none" | "active" | "trialing" | "past_due" | "canceled";

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  metadata?: { workspace_id?: string };
  items?: { data?: Array<{ price?: { id?: string } }> };
};

type StripeCheckoutSession = {
  client_reference_id?: string;
  customer?: string;
  mode?: string;
  subscription?: string;
};

billingRouter.post("/checkout", async (c) => {
  const unavailable = hostedBillingUnavailable();
  if (unavailable) return c.json({ error: unavailable }, 400);

  const ws = currentWorkspace(c);
  const user = currentUser(c);
  const customerId = ws.stripeCustomerId ?? (await createCustomer(ws, user?.email));

  if (!ws.stripeCustomerId) {
    await db
      .update(workspaces)
      .set({ stripeCustomerId: customerId })
      .where(eq(workspaces.id, ws.id));
  }

  const success = process.env.BILLING_SUCCESS_URL ?? webUrl("/settings?billing=success");
  const cancel = process.env.BILLING_CANCEL_URL ?? webUrl("/settings?billing=cancel");

  const session = await stripeRequest<{ url?: string }>(
    "/v1/checkout/sessions",
    {
      mode: "subscription",
      customer: customerId,
      client_reference_id: ws.id,
      success_url: success,
      cancel_url: cancel,
      "line_items[0][price]": requireEnv("STRIPE_STARTER_PRICE_ID"),
      "line_items[0][quantity]": "1",
      "metadata[workspace_id]": ws.id,
      "subscription_data[metadata][workspace_id]": ws.id,
      allow_promotion_codes: "true",
    },
  );

  if (!session.url) return c.json({ error: "stripe did not return a checkout url" }, 502);
  return c.json({ url: session.url });
});

billingRouter.post("/portal", async (c) => {
  const unavailable = hostedBillingUnavailable();
  if (unavailable) return c.json({ error: unavailable }, 400);

  const ws = currentWorkspace(c);
  if (!ws.stripeCustomerId) {
    return c.json({ error: "no Stripe customer for this workspace yet" }, 400);
  }

  const session = await stripeRequest<{ url?: string }>("/v1/billing_portal/sessions", {
    customer: ws.stripeCustomerId,
    return_url: process.env.BILLING_PORTAL_RETURN_URL ?? webUrl("/settings"),
  });

  if (!session.url) return c.json({ error: "stripe did not return a portal url" }, 502);
  return c.json({ url: session.url });
});

billingRouter.post("/webhook", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "stripe webhook is not configured" }, 400);

  const raw = await c.req.text();
  const sig = c.req.header("stripe-signature");
  if (!sig || !validStripeSignature(raw, sig, secret)) {
    return c.json({ error: "invalid Stripe signature" }, 400);
  }

  const event = JSON.parse(raw) as { type: string; data: { object: unknown } };

  if (event.type === "checkout.session.completed") {
    await syncCheckoutSession(event.data.object as StripeCheckoutSession);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscription(event.data.object as StripeSubscription);
  }

  return c.json({ received: true });
});

function hostedBillingUnavailable(): string | null {
  if (HELIA_MODE !== "hosted") return "billing is only available in hosted mode";
  if (!billingConfigured()) return "billing is not configured";
  return null;
}

async function createCustomer(ws: Workspace, email?: string | null): Promise<string> {
  const customer = await stripeRequest<{ id?: string }>("/v1/customers", {
    ...(email ? { email } : {}),
    name: ws.name,
    "metadata[workspace_id]": ws.id,
  });
  if (!customer.id) throw new Error("stripe did not return a customer id");
  return customer.id;
}

async function syncCheckoutSession(session: StripeCheckoutSession): Promise<void> {
  if (session.mode !== "subscription" || !session.subscription) return;
  const subscription = await stripeRequest<StripeSubscription>(
    `/v1/subscriptions/${encodeURIComponent(session.subscription)}`,
    undefined,
    "GET",
  );
  await syncSubscription({
    ...subscription,
    customer: subscription.customer ?? session.customer ?? "",
    metadata: {
      ...subscription.metadata,
      workspace_id: subscription.metadata?.workspace_id ?? session.client_reference_id,
    },
  });
}

async function syncSubscription(subscription: StripeSubscription): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : "";
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const status = normalizeStatus(subscription.status);
  const paid = status === "active" || status === "trialing";
  const workspaceId = subscription.metadata?.workspace_id;

  const updates = {
    plan: paid ? ("starter" as const) : ("free" as const),
    billingStatus: status,
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    tokenQuotaMonthly: paid ? STARTER_TOKEN_QUOTA : FREE_TOKEN_QUOTA,
  };

  if (workspaceId) {
    await db.update(workspaces).set(updates).where(eq(workspaces.id, workspaceId));
    return;
  }

  await db
    .update(workspaces)
    .set(updates)
    .where(
      or(
        eq(workspaces.stripeSubscriptionId, subscription.id),
        eq(workspaces.stripeCustomerId, customerId),
      ),
    );
}

function normalizeStatus(status: string): BillingStatus {
  if (status === "active" || status === "trialing" || status === "past_due") {
    return status;
  }
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    return "canceled";
  }
  return "none";
}

async function stripeRequest<T>(
  path: string,
  params?: Record<string, string>,
  method: "GET" | "POST" = "POST",
): Promise<T> {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${requireEnv("STRIPE_SECRET_KEY")}`,
      ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? new URLSearchParams(params) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`stripe ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

function validStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function webUrl(path: string): string {
  const base = process.env.HELIA_WEB_URL ?? "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}${path}`;
}
