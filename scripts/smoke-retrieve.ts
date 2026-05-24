/**
 * Smoke-test retrieval. Runs the same hybrid search the agent uses.
 *
 *   pnpm --filter @helia/api exec tsx ../../scripts/smoke-retrieve.ts <workspace-id> "<query>"
 */
import "@helia/config";
import { makeDb } from "@helia/db";
import { retrieve } from "@helia/rag";

async function main() {
  const ws = process.argv[2];
  const query = process.argv[3];
  if (!ws || !query) {
    console.error('usage: tsx scripts/smoke-retrieve.ts <workspace-id> "<query>"');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL!;
  const db = makeDb(url);
  const results = await retrieve(db, ws, query, { finalTop: 5, minScore: 0.005 });

  console.log(`→ workspace: ${ws}`);
  console.log(`→ query:     ${query}`);
  console.log(`→ hits:      ${results.length}`);
  for (const [i, r] of results.entries()) {
    const title = r.metadata?.docTitle ?? r.metadata?.url ?? "(no title)";
    console.log(`\n[${i + 1}] score=${r.score.toFixed(4)}  ${title}`);
    console.log(r.content.slice(0, 200));
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error("✗", err);
    process.exit(1);
  },
);
