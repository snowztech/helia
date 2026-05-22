"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Workspace } from "@/lib/api";

interface WorkspaceContextValue {
  workspace: Workspace | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WorkspaceContextValue>({
  workspace: null,
  loading: true,
  refresh: async () => {},
});

/**
 * Single source of truth for the current workspace in the admin chrome.
 * Pages that edit workspace fields (Settings, Widget) call refresh() after
 * a successful save so anything consuming this (header chip, footers, etc.)
 * picks up the new values without a page reload.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { workspace } = await api.getWorkspace();
      setWorkspace(workspace);
    } catch {
      // chrome should not block on a workspace fetch failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ workspace, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  return useContext(Ctx);
}
