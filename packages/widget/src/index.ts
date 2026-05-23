import { mount } from "./widget";
import type { WidgetConfig, WidgetHandle } from "./types";

const Helia = {
  init(config: WidgetConfig): WidgetHandle {
    return mount(config);
  },
};

export default Helia;
export { mount };
export type { WidgetConfig, WidgetHandle };

autoMount();

function autoMount(): void {
  if (typeof document === "undefined") return;

  const script = currentScript();
  if (!script) return;

  const workspace = script.getAttribute("data-workspace");
  if (!workspace) return;

  const apiUrl = script.getAttribute("data-api-url") ?? undefined;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mount({ workspace, apiUrl }));
  } else {
    mount({ workspace, apiUrl });
  }
}

function currentScript(): HTMLScriptElement | null {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript;
  }
  const scripts = document.getElementsByTagName("script");
  for (let i = scripts.length - 1; i >= 0; i--) {
    const s = scripts[i];
    if (s && s.src && s.src.includes("w.js")) return s;
  }
  return null;
}
