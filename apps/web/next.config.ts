import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal Node server in `.next/standalone/`
  // for the Docker image. About 10x smaller than copying node_modules.
  output: "standalone",
  // pnpm monorepo: tell the standalone tracer to resolve hoisted deps
  // from the workspace root, not from apps/web.
  outputFileTracingRoot: join(here, "..", ".."),
};

export default config;
