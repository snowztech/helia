#!/usr/bin/env node
/**
 * Copy the built widget bundle into apps/web/public/ so it's served at the
 * same origin as the admin. Customers paste a script tag pointing at
 * `<your-helia-host>/w.js`.
 *
 * Runs as `prebuild` from apps/web — `pnpm --filter @helia/widget build`
 * has to have populated packages/widget/dist/ first (handled by the
 * prebuild script in apps/web/package.json).
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const widgetDist = join(here, "..", "..", "..", "packages", "widget", "dist");
const publicDir = join(here, "..", "public");

const bundle = join(widgetDist, "w.js");
const sourcemap = join(widgetDist, "w.js.map");

if (!existsSync(bundle)) {
  console.error(
    "✗ packages/widget/dist/w.js missing — run `pnpm --filter @helia/widget build` first.",
  );
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });
cpSync(bundle, join(publicDir, "w.js"));
if (existsSync(sourcemap)) {
  cpSync(sourcemap, join(publicDir, "w.js.map"));
}

console.log("✓ widget copied to apps/web/public/w.js");
