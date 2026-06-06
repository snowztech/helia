import { readFile } from "node:fs/promises";
import { makeDb } from "@helia/db";
import { runRetrievalEval, type RetrievalEvalCase } from "./eval";

type CliOptions = {
  workspaceId: string | null;
  file: string;
  finalTop: number;
  minPassRate: number;
  json: boolean;
};

const options = parseArgs(process.argv.slice(2));

if (!options.workspaceId) {
  console.error(
    "Usage: pnpm --filter @helia/rag eval -- --workspace <uuid> [--file evals/retrieval.example.json] [--top 5] [--min-pass-rate 1] [--json]",
  );
  process.exit(1);
}

const raw = await readFile(options.file, "utf8");
const cases = JSON.parse(raw) as RetrievalEvalCase[];
const db = makeDb();
const summary = await runRetrievalEval(db, options.workspaceId, cases, {
  finalTop: options.finalTop,
});

if (options.json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  const thresholdPct = Math.round(options.minPassRate * 100);
  console.log(
    `Retrieval eval: ${summary.passed}/${summary.total} passed (${Math.round(
      summary.passRate * 100,
    )}%, required ${thresholdPct}%)`,
  );
  for (const result of summary.results) {
    const status = result.passed ? "PASS" : "FAIL";
    const rank = result.matchedRank ? `rank ${result.matchedRank}` : "no match";
    console.log(`${status} ${result.name} - ${rank}`);
  }
}

process.exit(summary.passRate >= options.minPassRate ? 0 : 1);

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    workspaceId: null,
    file: "evals/retrieval.example.json",
    finalTop: 5,
    minPassRate: 1,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--workspace") {
      options.workspaceId = args[++i] ?? null;
    } else if (arg === "--file") {
      options.file = args[++i] ?? options.file;
    } else if (arg === "--top") {
      options.finalTop = Number(args[++i] ?? options.finalTop);
    } else if (arg === "--min-pass-rate") {
      options.minPassRate = parsePassRate(args[++i] ?? "");
    } else if (arg === "--json") {
      options.json = true;
    }
  }

  return options;
}

function parsePassRate(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    console.error("--min-pass-rate must be a number between 0 and 1");
    process.exit(1);
  }
  return parsed;
}
