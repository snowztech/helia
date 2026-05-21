/**
 * Recursive character splitter (LangChain-style).
 * Tries each separator in order; falls back to hard split.
 * Sizes are in "approximate tokens" (4 chars ≈ 1 token).
 */

export type Chunk = {
  content: string;
  tokens: number;
};

const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];
const APPROX_CHARS_PER_TOKEN = 4;

export type ChunkOptions = {
  targetTokens?: number;  // default 600
  overlapTokens?: number; // default 80
  minTokens?: number;     // skip chunks below this (after split)
};

export function chunkText(text: string, opts: ChunkOptions = {}): Chunk[] {
  const targetTokens = opts.targetTokens ?? 600;
  const overlapTokens = opts.overlapTokens ?? 80;
  const minTokens = opts.minTokens ?? 10;
  const targetChars = targetTokens * APPROX_CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * APPROX_CHARS_PER_TOKEN;
  const minChars = minTokens * APPROX_CHARS_PER_TOKEN;

  const pieces = split(text, targetChars);
  const chunks: Chunk[] = [];

  let current = "";
  for (const piece of pieces) {
    if (current.length + piece.length <= targetChars) {
      current += piece;
    } else {
      if (current.length > 0) {
        chunks.push(toChunk(current));
        current = current.slice(-overlapChars) + piece;
      } else {
        for (let i = 0; i < piece.length; i += targetChars) {
          chunks.push(toChunk(piece.slice(i, i + targetChars)));
        }
        current = "";
      }
    }
  }
  if (current.trim().length > 0) chunks.push(toChunk(current));

  return chunks.filter((c) => c.content.length >= minChars);
}

function split(text: string, target: number): string[] {
  if (text.length <= target) return [text];

  for (const sep of SEPARATORS) {
    if (sep === "") {
      const out: string[] = [];
      for (let i = 0; i < text.length; i += target) {
        out.push(text.slice(i, i + target));
      }
      return out;
    }
    if (text.includes(sep)) {
      return text.split(sep).flatMap((part, idx, arr) => {
        const withSep = idx < arr.length - 1 ? part + sep : part;
        return split(withSep, target);
      });
    }
  }
  return [text];
}

function toChunk(content: string): Chunk {
  const trimmed = content.trim();
  return {
    content: trimmed,
    tokens: Math.ceil(trimmed.length / APPROX_CHARS_PER_TOKEN),
  };
}
