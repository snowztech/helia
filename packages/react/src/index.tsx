import { useEffect, useId, useMemo } from "react";
import Helia, { type Identity, type WidgetHandle } from "@gethelia/widget";
import type { CSSProperties } from "react";

export type HeliaWidgetProps = {
  workspace: string;
  apiUrl?: string;
  mode?: "floating" | "embedded";
  target?: string;
  botName?: string;
  greeting?: string;
  identity?: Identity | null;
  tokenEndpoint?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * React wrapper around the same vanilla widget used by the script tag.
 * Floating mode renders no DOM. Embedded mode renders a target container
 * unless the caller passes an existing `target` selector.
 */
export function HeliaWidget(props: HeliaWidgetProps) {
  const generatedId = useStableTargetId();
  const embedded = props.mode === "embedded";
  const target = props.target ?? (embedded ? `#${generatedId}` : undefined);

  useEffect(() => {
    if (props.identity) {
      Helia.identify(props.identity);
      return;
    }
    if (!props.tokenEndpoint) {
      Helia.reset();
      return;
    }

    Helia.reset();
    let cancelled = false;
    void fetchIdentity(props.tokenEndpoint)
      .then((identity) => {
        if (!cancelled && identity) Helia.identify(identity);
      })
      .catch((err) => {
        console.warn("[helia] token endpoint fetch failed", err);
      });

    return () => {
      cancelled = true;
    };
  }, [props.identity, props.tokenEndpoint]);

  useEffect(() => {
    if (!props.workspace) return;

    let handle: WidgetHandle | null = null;

    handle = Helia.init({
      workspace: props.workspace,
      apiUrl: props.apiUrl,
      mode: props.mode,
      target,
      botName: props.botName,
      greeting: props.greeting,
    });

    return () => {
      handle?.destroy();
      Helia.reset();
    };
  }, [
    props.workspace,
    props.apiUrl,
    props.mode,
    target,
    props.botName,
    props.greeting,
  ]);

  if (!embedded || props.target) return null;

  return <div id={generatedId} className={props.className} style={props.style} />;
}

export type { Identity, WidgetConfig, WidgetHandle } from "@gethelia/widget";

async function fetchIdentity(endpoint: string): Promise<Identity | null> {
  const res = await fetch(endpoint, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Helia token endpoint returned ${res.status}`);
  const data = (await res.json()) as Partial<Identity>;
  if (!data.id || !data.signature) {
    throw new Error("Helia token endpoint response missing id or signature");
  }
  return data.name
    ? { id: data.id, name: data.name, signature: data.signature }
    : { id: data.id, signature: data.signature };
}

function useStableTargetId(): string {
  const id = useId();
  return useMemo(
    () => `helia-react-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [id],
  );
}
