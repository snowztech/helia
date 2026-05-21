/**
 * Thin client for the Helia API.
 *
 * The API base URL is configured via `NEXT_PUBLIC_API_URL`. We use the
 * `NEXT_PUBLIC_` prefix so the value is available client-side too (the
 * chat hook calls the API directly from the browser).
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${path}: ${text}`);
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
