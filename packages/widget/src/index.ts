import { mount } from "./widget";
import { setIdentity, clearIdentity } from "./identity";
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
