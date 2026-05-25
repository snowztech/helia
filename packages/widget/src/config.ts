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
