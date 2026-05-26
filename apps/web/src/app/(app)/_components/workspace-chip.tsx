"use client";

import { useWorkspace } from "./workspace-provider";

/**
 * Tiny indicator in the header showing which workspace the admin is
 * editing. Reads from the shared workspace context so name edits in
 * Settings reflect here immediately.
 */
export function WorkspaceChip() {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
      <span
        className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success"
        aria-hidden="true"
      />
      <span className="max-w-[6rem] truncate font-mono sm:max-w-none">
        {workspace.name}
      </span>
    </div>
  );
}
