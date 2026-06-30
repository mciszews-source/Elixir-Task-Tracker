import type { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "font-display inline-flex rounded-full px-2.5 py-[2px] text-[10px] font-bold tracking-[0.12em] uppercase",
        `status-${status}`,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
