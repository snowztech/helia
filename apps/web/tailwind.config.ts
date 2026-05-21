import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // Disable Tailwind's preflight — @snowztech/ui ships its own reset and
  // base element styles. Letting preflight win clobbers `.sn-btn` text color
  // and `.sn-card` backgrounds.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};

export default config;
