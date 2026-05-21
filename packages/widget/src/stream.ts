import type { ChatMessage } from "./types";

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onToolStart: (toolName: string) => void;
  onToolEnd: () => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

/**
 * Consume the Vercel AI SDK v4 data stream from POST /v1/chat.
 *
 * Each line is `<type>:<json>`. We care about:
 *  - "0" text delta
 *  - "9" tool call start
 *  - "a" tool call result
 *  - "d" finish
 *  - "3" error
 */
export async function streamChat(
  apiUrl: string,
  messages: ChatMessage[],
  cb: StreamCallbacks,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/chat`, {
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line) continue;
      handleLine(line, cb);
    }
  }

  if (buf) handleLine(buf, cb);
  cb.onDone();
}

function handleLine(line: string, cb: StreamCallbacks): void {
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
      const name = (data as { toolName?: string })?.toolName ?? "tool";
      cb.onToolStart(name);
      return;
    }
    case "a": {
      cb.onToolEnd();
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
