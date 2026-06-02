import type { Db } from "@helia/db";
import { retrieve, type RetrieveOptions } from "./retrieve";

export type RetrievalEvalCase = {
  name: string;
  question: string;
  expected: {
    title?: string;
    url?: string;
    chunkId?: string;
  };
};

export type RetrievalEvalResult = {
  name: string;
  question: string;
  passed: boolean;
  expected: RetrievalEvalCase["expected"];
  matchedRank: number | null;
  results: Array<{
    rank: number;
    chunkId: string;
    title: string;
    url: string | null;
    score: number;
  }>;
};

export type RetrievalEvalSummary = {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  results: RetrievalEvalResult[];
};

export async function runRetrievalEval(
  db: Db,
  workspaceId: string,
  cases: RetrievalEvalCase[],
  options: RetrieveOptions = {},
): Promise<RetrievalEvalSummary> {
  const results: RetrievalEvalResult[] = [];

  for (const item of cases) {
    const chunks = await retrieve(db, workspaceId, item.question, {
      finalTop: 5,
      ...options,
    });
    const ranked = chunks.map((chunk, index) => ({
      rank: index + 1,
      chunkId: chunk.id,
      title: chunk.metadata?.docTitle ?? chunk.metadata?.url ?? "source",
      url: chunk.metadata?.url ?? null,
      score: chunk.score,
    }));
    const match = ranked.find((result) => matchesExpected(result, item));
    results.push({
      name: item.name,
      question: item.question,
      passed: Boolean(match),
      expected: item.expected,
      matchedRank: match?.rank ?? null,
      results: ranked,
    });
  }

  const passed = results.filter((result) => result.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length === 0 ? 0 : passed / results.length,
    results,
  };
}

function matchesExpected(
  result: RetrievalEvalResult["results"][number],
  item: RetrievalEvalCase,
): boolean {
  const expected = item.expected;
  if (expected.chunkId && result.chunkId === expected.chunkId) return true;
  if (expected.url && result.url === expected.url) return true;
  if (expected.title && result.title === expected.title) return true;
  return false;
}
