import type { ChatMessage } from "./types";

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onToolStart: (toolName: string, args: unknown) => void;
  onToolResult: (toolName: string, result: unknown) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

/**
 * Consume the Vercel AI SDK v4 data stream from POST /v1/chat.
 *
 * Each line is `<type>:<json>`. We care about:
 *  - "0" text delta
 *  - "9" tool call start (with toolCallId, toolName, args)
 *  - "a" tool call result (with toolCallId, result)
 *  - "d" finish
 *  - "3" error
 */
export async function streamChat(
  apiUrl: string,
  workspace: string,
  messages: ChatMessage[],
  cb: StreamCallbacks,
): Promise<void> {
  let res: Response;
  try {
    const base = apiUrl.replace(/\/$/, "");
    const url = `${base}/v1/chat?ws=${encodeURIComponent(workspace)}`;
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    cb.onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!res.ok || !res.body) {
    cb.onError(new Error(`Chat request failed: HTTP ${res.status}`));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  // Track in-flight tool calls so we can pair `a:` results with `9:` starts
  // and report the tool name on result events.
  const toolNames = new Map<string, string>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line) continue;
      handleLine(line, cb, toolNames);
    }
  }

  if (buf) handleLine(buf, cb, toolNames);
  cb.onDone();
}

function handleLine(
  line: string,
  cb: StreamCallbacks,
  toolNames: Map<string, string>,
): void {
  const colon = line.indexOf(":");
  if (colon < 1) return;
  const type = line.slice(0, colon);
  const payload = line.slice(colon + 1);

  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    return;
  }

  switch (type) {
    case "0": {
      if (typeof data === "string") cb.onDelta(data);
      return;
    }
    case "9": {
      const info = data as { toolCallId?: string; toolName?: string; args?: unknown };
      const name = info.toolName ?? "tool";
      if (info.toolCallId) toolNames.set(info.toolCallId, name);
      cb.onToolStart(name, info.args ?? null);
      return;
    }
    case "a": {
      const info = data as { toolCallId?: string; result?: unknown };
      const name =
        (info.toolCallId && toolNames.get(info.toolCallId)) ?? "tool";
      cb.onToolResult(name, info.result ?? null);
      return;
    }
    case "3": {
      const msg = typeof data === "string" ? data : "Stream error";
      cb.onError(new Error(msg));
      return;
    }
    default:
      return;
  }
}
