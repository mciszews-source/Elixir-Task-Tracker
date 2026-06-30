import type { TaskWithRelations } from "@/types/database";
import { cn, formatDueDate } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";

interface TaskCardProps {
  task: TaskWithRelations;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function TaskCard({ task, isDragging, dragHandleProps }: TaskCardProps) {
  const dueLabel = formatDueDate(task.due_date);
  const teamColor = task.team?.color ?? "#4A78C4";

  return (
    <article
      className={cn(
        "group glass-card glass-card-hover relative flex gap-3 rounded-xl p-4 transition-all",
        "before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[3px] before:rounded-l-xl before:content-['']",
        "task-p-" + task.priority,
        isDragging && "opacity-60 ring-1 ring-white/40",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="mt-0.5 cursor-grab text-white/25 transition hover:text-white/65 active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="font-display inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] font-bold tracking-[0.12em] uppercase"
            style={{
              backgroundColor: `${teamColor}22`,
              color: teamColor,
              borderColor: `${teamColor}55`,
            }}
          >
            {task.team?.name ?? "Team"}
          </span>
          {dueLabel && (
            <span className="font-display shrink-0 text-[11px] tracking-wide text-white/50">
              Due {dueLabel}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-[15px] font-medium text-white/90">
          {task.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
          {task.assignee?.full_name && <span>{task.assignee.full_name}</span>}
          <StatusPill status={task.status} />
          <span
            className={cn(
              "font-display rounded-full px-2 py-[2px] text-[9px] font-bold tracking-[0.1em] uppercase",
              "priority-" + task.priority,
            )}
          >
            {task.priority}
          </span>
        </div>
      </div>
    </article>
  );
}
