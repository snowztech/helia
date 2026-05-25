import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import rootPkg from "../../package.json";

const here = dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: join(here, "..", ".."),
  env: {
    NEXT_PUBLIC_HELIA_VERSION: rootPkg.version,
    NEXT_PUBLIC_APP_URL: process.env.HELIA_WEB_URL ?? "https://app.gethelia.dev",
  },
};

export default config;
