import "@helia/config"; // loads root .env
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import rootPkg from "../../package.json";

const here = dirname(fileURLToPath(import.meta.url));

const apiUrl =
  process.env.HELIA_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: join(here, "..", ".."),
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_HELIA_VERSION: rootPkg.version,
  },
};

export default config;
