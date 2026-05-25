import { mount } from "./widget";
import { setIdentity, clearIdentity, fetchAndSetIdentity } from "./identity";
import type { Identity, WidgetConfig, WidgetHandle } from "./types";

const Helia = {
  init(config: WidgetConfig): WidgetHandle {
    return mount(config);
  },
  /**
   * Pass the signed end-user identity to Helia. The host's backend MUST
   * have HMAC-signed `{id, name?}` with the workspace's identity secret;
   * Helia rejects bad signatures.
   */
  identify(identity: Identity): void {
    setIdentity(identity);
  },
  /** Clear any previously-set identity (e.g. on host logout). */
  reset(): void {
    clearIdentity();
  },
};

export default Helia;
export { mount };
export type { Identity, WidgetConfig, WidgetHandle };

autoMount();

function autoMount(): void {
  if (typeof document === "undefined") return;

  const script = currentScript();
  if (!script) {
    console.warn(
      "[helia] could not find the widget script tag. Make sure the snippet from /settings is on the page.",
    );
    return;
  }

  const workspace = script.getAttribute("data-workspace");
  if (!workspace) {
    console.warn("[helia] missing data-workspace attribute on script tag.");
    return;
  }

  const apiUrl = script.getAttribute("data-api-url") ?? undefined;
  const tokenEndpoint = script.getAttribute("data-token-endpoint") ?? undefined;

  const boot = () => {
    mount({ workspace, apiUrl });
    if (tokenEndpoint) void fetchAndSetIdentity(tokenEndpoint);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
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
