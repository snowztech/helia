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
  locale: string;
  model: string;
  brandPrimary: string;
  botName: string;
  botSubtitle: string;
  botGreeting: string;
  botPlaceholder: string;
  botSuggestions: string[];
  widgetPosition: WidgetPosition;
  widgetTheme: WidgetTheme;
  widgetRadius: number;
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
  >
>;

export type SystemInfo = {
  version: string;
  provider: "openai";
  model: string;
  keyConfigured: boolean;
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
    throw new ApiError(res.status, path, `${res.status} ${path}: ${text}`);
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
    if (!res.ok) throw new Error(`upload pdf failed: ${res.status}`);
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

  listConversations: (limit?: number) =>
    request<{ conversations: ConversationSummary[] }>(
      `/v1/conversations${limit ? `?limit=${limit}` : ""}`,
    ),

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

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: string | null;
};

export type Metrics = {
  messagesToday: number;
  messagesWeek: number;
  messagesTotal: number;
  avgLatencyMs: number;
  tokensWeek: number;
};

export type ConversationSummary = {
  id: string;
  userMessage: string;
  finalAnswer: string | null;
  totalTokens: number;
  totalLatencyMs: number;
  model: string;
  sourceCount: number;
  error: string | null;
  createdAt: string;
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
  headers: Record<string, string>;
  timeoutMs: number;
  maxResponseBytes: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ToolInput = {
  name: string;
  description: string;
  url: string;
  method: "GET" | "POST";
  paramsSchema: ToolParam[];
  headers: Record<string, string>;
  timeoutMs?: number;
  maxResponseBytes?: number;
  enabled?: boolean;
};
