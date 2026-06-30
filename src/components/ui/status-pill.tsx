import type { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700" },
  in_progress: { label: "In progress", className: "bg-amber-50 text-amber-700" },
  blocked: { label: "Blocked", className: "bg-red-50 text-red-700" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700" },
};

export function StatusPill({ status }: { status: TaskStatus }) {
  const config = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
