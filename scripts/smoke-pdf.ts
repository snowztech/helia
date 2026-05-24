/**
 * Smoke-test the PDF extraction path without going through the API.
 *
 *   pnpm --filter @helia/api exec tsx ../../scripts/smoke-pdf.ts <path>
 *
 * Reports byte size, page count, extracted char count, and the first 400
 * chars so we can see whether pdf-parse pulled anything readable.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extractPdf } from "@helia/rag";
import { chunkText } from "@helia/rag";

async function main() {
  const path = resolve(process.argv[2] ?? "");
  if (!path) {
    console.error("usage: tsx scripts/smoke-pdf.ts <pdf-path>");
    process.exit(1);
  }
  const buffer = await readFile(path);
  console.log(`→ ${path}  (${(buffer.length / 1024).toFixed(1)} kB)`);

  const doc = await extractPdf(buffer);
  console.log(`→ pages:  ${doc.meta.pageCount ?? "?"}`);
  console.log(`→ title:  ${doc.meta.title ?? "(none)"}`);
  console.log(`→ chars:  ${doc.text.length}`);
  console.log(`→ first 400:\n---\n${doc.text.slice(0, 400)}\n---`);

  const pieces = chunkText(doc.text);
  console.log(`→ chunks: ${pieces.length}`);
  if (pieces[0]) {
    console.log(`→ chunk[0] tokens=${pieces[0].tokens}, content[0..200]:`);
    console.log(pieces[0].content.slice(0, 200));
  }
}

main().catch((err) => {
  console.error("✗ extraction failed:", err);
  process.exit(1);
});
