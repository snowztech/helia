"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export function DeleteSourceButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="sn-btn sn-btn--ghost sn-btn--sm"
      disabled={busy}
      title="Delete source"
      onClick={async () => {
        if (!confirm(`Delete "${name}"? This removes its chunks and events.`)) return;
        setBusy(true);
        try {
          await api.deleteSource(id);
          router.refresh();
        } catch (err) {
          alert(`Delete failed: ${err}`);
        } finally {
          setBusy(false);
        }
      }}
    >
      ✕
    </button>
  );
}
