export interface RemoteConfig {
  workspace: { id: string; name: string; locale?: string };
  theme: {
    primary: string;
    mode?: "light" | "dark" | "auto";
    radius?: number;
  };
  layout?: {
    position?: "bottom-right" | "bottom-left";
  };
  bot: {
    name: string;
    subtitle?: string;
    greeting: string;
    placeholder?: string;
    suggestions?: string[];
    avatar?: string | null;
  };
}

export async function loadRemoteConfig(
  apiUrl: string,
  workspace: string,
): Promise<RemoteConfig | null> {
  const url = `${apiUrl.replace(/\/$/, "")}/v1/widget/config?ws=${encodeURIComponent(workspace)}`;
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) {
      console.warn(
        `[helia] widget config fetch returned ${res.status}. The widget will use defaults. Check that this origin is in your workspace allowlist.`,
      );
      return null;
    }
    return (await res.json()) as RemoteConfig;
  } catch (err) {
    console.warn(
      "[helia] widget config fetch failed (network error). The widget will use defaults.",
      err,
    );
    return null;
  }
}

/**
 * Cache the last good config per workspace in localStorage. Used to paint
 * the right brand on the first frame instead of flashing defaults while
 * the network call to /v1/widget/config is in flight.
 */
const CACHE_PREFIX = "helia.config.";

export function readCachedConfig(workspace: string): RemoteConfig | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + workspace);
    if (!raw) return null;
    return JSON.parse(raw) as RemoteConfig;
  } catch {
    return null;
  }
}

export function writeCachedConfig(
  workspace: string,
  config: RemoteConfig,
): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + workspace,
      JSON.stringify(config),
    );
  } catch {
    // Quota or privacy mode — silent fallback to defaults next load.
  }
}
