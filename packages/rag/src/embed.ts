import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

const MODEL = "text-embedding-3-small"; // 1536 dims, cheap, multilingual
const BATCH_SIZE = 64;
const MAX_RETRIES = 3;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const vectors = await withRetry(() =>
      embedMany({ model: openai.embedding(MODEL), values: batch }),
    );
    all.push(...vectors.embeddings);
  }
  return all;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  if (!vec) throw new Error("Embedding failed: empty result");
  return vec;
}

async function withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const isRetryable = isTransientError(err);
    if (!isRetryable || attempt >= MAX_RETRIES) throw err;
    const backoffMs = 500 * Math.pow(2, attempt - 1); // 500, 1000, 2000
    await new Promise((r) => setTimeout(r, backoffMs));
    return withRetry(fn, attempt + 1);
  }
}

function isTransientError(err: unknown): boolean {
  const msg = String(err);
  return (
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT")
  );
}
