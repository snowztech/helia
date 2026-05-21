export interface RemoteConfig {
  workspace: { id: string; name: string };
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
  };
}

export async function loadRemoteConfig(
  apiUrl: string,
  workspace: string,
): Promise<RemoteConfig | null> {
  try {
    const url = `${apiUrl.replace(/\/$/, "")}/v1/widget/config?ws=${encodeURIComponent(workspace)}`;
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) return null;
    return (await res.json()) as RemoteConfig;
  } catch {
    return null;
  }
}
