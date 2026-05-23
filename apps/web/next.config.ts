import "@helia/config"; // loads root .env
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = dirname(fileURLToPath(import.meta.url));

// Translate the user-facing var to the Next.js convention. `NEXT_PUBLIC_*`
// is the only env shape that gets inlined for the browser bundle, so we
// surface the friendly name in .env and copy it through here.
const apiUrl =
  process.env.HELIA_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const config: NextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal Node server in `.next/standalone/`
  // for the Docker image. About 10x smaller than copying node_modules.
  output: "standalone",
  // pnpm monorepo: tell the standalone tracer to resolve hoisted deps
  // from the workspace root, not from apps/web.
  outputFileTracingRoot: join(here, "..", ".."),
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

export default config;
