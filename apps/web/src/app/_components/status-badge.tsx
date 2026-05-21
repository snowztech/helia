import { Badge } from "@/components/ui/badge";

type Status = "queued" | "processing" | "ready" | "failed";

const VARIANT: Record<Status, "default" | "primary" | "success" | "destructive"> = {
  queued: "default",
  processing: "primary",
  ready: "success",
  failed: "destructive",
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
  return <Badge variant={VARIANT[status]}>{label}</Badge>;
}
