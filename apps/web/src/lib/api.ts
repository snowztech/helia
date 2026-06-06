/**
 * Thin client for the Helia API.
 *
 * The base URL differs by execution context:
 *   - Browser: `NEXT_PUBLIC_API_URL`, populated from `HELIA_API_URL` via
 *     `next.config.ts`. Must be reachable from the user's network.
 *   - Server components: `HELIA_INTERNAL_API_URL`, the container-internal
 *     hostname (`http://api:4000` in docker compose). Set by compose, not
 *     by users.
 *
 * Both fall back to localhost:4000 for local dev.
 */

const browserApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const serverApiUrl =
  process.env.HELIA_INTERNAL_API_URL ?? browserApiUrl;

export const API_URL =
  typeof window === "undefined" ? serverApiUrl : browserApiUrl;

export type Source = {
  id: string;
  workspaceId: string;
  name: string;
  type: "pdf" | "text" | "url";
  status: "queued" | "processing" | "ready" | "failed";
  progress: number;
  error: string | null;
  config: Record<string, unknown> | null;
  stats: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type SourceEvent = {
  id: string;
  sourceId: string;
  level: "info" | "warn" | "error";
  message: string;
  data: Record<string, unknown> | null;
  createdAt: string;
};

export type Chunk = {
  id: string;
  sourceId: string;
  content: string;
  tokens: number;
  metadata: {
    docTitle?: string;
    section?: string;
    page?: number;
    url?: string;
  } | null;
};

export type WidgetPosition = "bottom-right" | "bottom-left";
export type WidgetTheme = "light" | "dark" | "auto";

export type Workspace = {
  id: string;
  name: string;
  plan: "free" | "starter";
  billingStatus: "none" | "active" | "trialing" | "past_due" | "canceled";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  locale: string;
  model: string;
  brandPrimary: string;
  botName: string;
  botSubtitle: string;
  botGreeting: string;
  botPlaceholder: string;
  botSuggestions: string[];
  botAvatar: string | null;
  widgetPosition: WidgetPosition;
  widgetTheme: WidgetTheme;
  widgetRadius: number;
  identityRequired: boolean;
  identityConfigured: boolean;
  tokenQuotaMonthly: number;
  allowedOrigins: string[];
  createdAt: string;
};

export type WorkspacePatch = Partial<
  Pick<
    Workspace,
    | "name"
    | "locale"
    | "model"
    | "brandPrimary"
    | "botName"
    | "botSubtitle"
    | "botGreeting"
    | "botPlaceholder"
    | "botSuggestions"
    | "widgetPosition"
    | "widgetTheme"
    | "widgetRadius"
    | "botAvatar"
    | "identityRequired"
    | "tokenQuotaMonthly"
    | "allowedOrigins"
  >
>;

export type SystemInfo = {
  version: string;
  mode: "hosted" | "self_host";
  provider: "openai";
  model: string;
  keyConfigured: boolean;
  billingConfigured: boolean;
  allowedOrigins: string[] | "wildcard" | "dev-localhost";
  nodeEnv: string;
};

/**
 * Forward the auth cookie when called from a server component. In the
 * browser, the cookie rides automatically via `credentials: "include"`.
 */
async function authHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {};
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const session = store.get("helia_session");
  return session ? { cookie: `helia_session=${session.value}` } : {};
}

export class ApiError extends Error {
  constructor(public status: number, public path: string, msg: string) {
    super(msg);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = await authHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: { ...auth, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text;
    try {
      const json = JSON.parse(text) as { error?: unknown };
      if (typeof json.error === "string") message = json.error;
    } catch {
      // keep raw response text
    }
    throw new ApiError(res.status, path, `${res.status} ${path}: ${message}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listSources: () => request<{ sources: Source[] }>("/v1/sources"),

  getSource: (id: string) => request<{ source: Source }>(`/v1/sources/${id}`),

  getSourceEvents: (id: string) =>
    request<{ events: SourceEvent[] }>(`/v1/sources/${id}/events`),

  deleteSource: (id: string) =>
    request<{ ok: true }>(`/v1/sources/${id}`, { method: "DELETE" }),

  getChunk: (id: string) => request<{ chunk: Chunk }>(`/v1/chunks/${id}`),

  uploadPdf: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/v1/sources/pdf`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      let message: string | null = null;
      try {
        const json = JSON.parse(text) as { error?: unknown };
        if (typeof json.error === "string") message = json.error;
      } catch {
        // fall through
      }
      if (message) throw new Error(message);
      throw new Error(`upload pdf failed: ${res.status}`);
    }
    return res.json() as Promise<{ source: Source; error?: string }>;
  },

  uploadText: (name: string, text: string) =>
    request<{ source: Source; error?: string }>("/v1/sources/text", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, text }),
    }),

  uploadUrl: (url: string, maxPages?: number) =>
    request<{ source: Source }>("/v1/sources/url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, maxPages }),
    }),

  getWorkspace: () => request<{ workspace: Workspace }>("/v1/workspace"),

  patchWorkspace: (patch: WorkspacePatch) =>
    request<{ workspace: Workspace }>("/v1/workspace", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }),

  rotateIdentitySecret: () =>
    request<{ secret: string }>("/v1/workspace/identity-secret/rotate", {
      method: "POST",
    }),

  listTools: () => request<{ tools: HeliaTool[] }>("/v1/tools"),

  createTool: (input: ToolInput) =>
    request<{ tool: HeliaTool }>("/v1/tools", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),

  updateTool: (id: string, patch: Partial<ToolInput>) =>
    request<{ tool: HeliaTool }>(`/v1/tools/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }),

  deleteTool: (id: string) =>
    request<{ ok: true }>(`/v1/tools/${id}`, { method: "DELETE" }),

  getSystem: () => request<SystemInfo>("/v1/system"),

  getMetrics: () => request<Metrics>("/v1/metrics"),

  getUsage: () => request<Usage>("/v1/metrics/usage"),

  createBillingCheckout: () =>
    request<{ url: string }>("/v1/billing/checkout", { method: "POST" }),

  createBillingPortal: () =>
    request<{ url: string }>("/v1/billing/portal", { method: "POST" }),

  listConversations: (opts?: { limit?: number; errors?: boolean }) => {
    const q = new URLSearchParams();
    if (opts?.limit) q.set("limit", String(opts.limit));
    if (opts?.errors) q.set("errors", "true");
    const qs = q.toString();
    return request<{ conversations: ConversationSummary[] }>(
      `/v1/conversations${qs ? `?${qs}` : ""}`,
    );
  },

  getConversation: (id: string) =>
    request<{ conversation: ConversationDetail }>(`/v1/conversations/${id}`),

  deleteConversation: (id: string) =>
    request<{ ok: true; deleted: number }>(`/v1/conversations/${id}`, {
      method: "DELETE",
    }),

  deleteAllConversations: () =>
    request<{ ok: true; deleted: number }>(`/v1/conversations`, {
      method: "DELETE",
    }),

  listBans: () => request<{ bans: BannedUser[] }>("/v1/banned-users"),

  banUser: (input: { userId: string; reason?: string | null }) =>
    request<{ ban: BannedUser }>("/v1/banned-users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),

  unbanUser: (userId: string) =>
    request<{ ok: true }>(`/v1/banned-users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),

  signup: (input: { email: string; password: string; name?: string }) =>
    request<{ user: AuthUser; workspace: { id: string; name: string } }>(
      "/v1/auth/signup",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    ),

  login: (input: { email: string; password: string }) =>
    request<{ user: AuthUser }>("/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),

  logout: () => request<{ ok: true }>("/v1/auth/logout", { method: "POST" }),

  me: () => request<{ user: AuthUser | null }>("/v1/auth/me"),

  verifyEmail: (token: string) =>
    request<{ ok: true }>("/v1/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    request<{ ok: true }>("/v1/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }),

  resetPassword: (input: { token: string; password: string }) =>
    request<{ ok: true }>("/v1/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),

  resendVerification: () =>
    request<{ ok: true; alreadyVerified?: boolean }>(
      "/v1/auth/resend-verification",
      { method: "POST" },
    ),

  deleteAccount: (password: string) =>
    request<{ ok: true }>("/v1/auth/me", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }),
};

export type BannedUser = {
  workspaceId: string;
  userId: string;
  reason: string | null;
  bannedAt: string;
  bannedBy: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: string | null;
};

export type Metrics = {
  // Anchored to the billing cycle (calendar month, UTC) so monthly
  // numbers on the dashboard roll over with the token quota.
  conversationsToday: number;
  conversationsMonth: number;
  conversationsTotal: number;
  messagesToday: number;
  messagesMonth: number;
  messagesTotal: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorsMonth: number;
  tokensMonth: number;
};

export type Usage = {
  tokensUsedMonth: number;
  tokenQuotaMonthly: number;
  monthResetsAt: string;
};

export const FREE_SOURCE_LIMIT = 3;
export const STARTER_SOURCE_LIMIT = 50;

export function hostedSourceLimit(workspace: Workspace, system: SystemInfo): number | null {
  if (system.mode !== "hosted") return null;
  return workspace.plan === "starter" ? STARTER_SOURCE_LIMIT : FREE_SOURCE_LIMIT;
}

export function hostedToolsAllowed(workspace: Workspace, system: SystemInfo): boolean {
  if (system.mode !== "hosted") return true;
  return (
    workspace.plan === "starter" &&
    (workspace.billingStatus === "active" ||
      workspace.billingStatus === "trialing")
  );
}

export type ConversationSummary = {
  id: string;
  userId: string | null;
  userName: string | null;
  lastUserMessage: string;
  turns: number;
  hasError: boolean;
  lastActiveAt: string;
};

export type RetrievalChunk = {
  title: string;
  url: string | null;
  score: number;
};

/**
 * Agent step as recorded by the Vercel AI SDK. We don't model every shape
 * here; the detail UI walks the fields it knows about and skips the rest.
 */
export type ConversationStep = {
  text?: string;
  toolCalls?: Array<{
    toolCallId?: string;
    toolName?: string;
    args?: unknown;
  }>;
  toolResults?: Array<{
    toolCallId?: string;
    toolName?: string;
    result?: unknown;
  }>;
};

export type ConversationTurn = {
  id: string;
  userMessage: string;
  finalAnswer: string | null;
  totalTokens: number;
  totalLatencyMs: number;
  model: string;
  retrieval: RetrievalChunk[];
  steps: ConversationStep[];
  error: string | null;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  userId: string | null;
  userName: string | null;
  model: string;
  startedAt: string;
  lastActiveAt: string;
  totalTokens: number;
  turns: ConversationTurn[];
};

export type ToolParam = {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  source: "llm" | "context";
  contextPath?: string;
};

export type HeliaTool = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  url: string;
  method: "GET" | "POST";
  paramsSchema: ToolParam[];
  /** Masked: server returns { name: { set: true } }, never plaintext. */
  headers: Record<string, { set: true }>;
  timeoutMs: number;
  maxResponseBytes: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Sentinel value the tool form submits in place of a stored header value
 * the user didn't touch. The API leaves the existing ciphertext alone.
 */
export const HEADER_KEEP = "__keep__";

export type ToolInput = {
  name: string;
  description: string;
  url: string;
  method: "GET" | "POST";
  paramsSchema: ToolParam[];
  /**
   * Values being submitted. Use {@link HEADER_KEEP} to mean "leave the
   * stored value alone"; anything else replaces.
   */
  headers: Record<string, string>;
  timeoutMs?: number;
  maxResponseBytes?: number;
  enabled?: boolean;
};
