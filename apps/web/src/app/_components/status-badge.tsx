type Status = "queued" | "processing" | "ready" | "failed";

// snowztech/ui modifier syntax: double-dash.
const VARIANT: Record<Status, string> = {
  queued: "sn-badge",
  processing: "sn-badge sn-badge--accent",
  ready: "sn-badge sn-badge--success",
  failed: "sn-badge sn-badge--danger",
};

export function StatusBadge({
  status,
  progress,
}: {
  status: Status;
  progress?: number;
}) {
  const label =
    status === "processing" && typeof progress === "number"
      ? `processing · ${progress}%`
      : status;
  return <span className={VARIANT[status]}>{label}</span>;
}
