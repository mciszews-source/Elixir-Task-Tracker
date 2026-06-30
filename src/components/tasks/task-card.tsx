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
  const teamColor = task.team?.color ?? "#1e40af";

  return (
    <article
      className={cn(
        "group flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow",
        "hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/30",
        isDragging && "opacity-80 shadow-lg ring-2 ring-blue-400/40",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${teamColor}15`,
              color: teamColor,
            }}
          >
            {task.team?.name ?? "Team"}
          </span>
          {dueLabel && (
            <span className="shrink-0 text-xs text-slate-500">Due {dueLabel}</span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-medium text-slate-900">
          {task.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {task.assignee?.full_name && <span>{task.assignee.full_name}</span>}
          <StatusPill status={task.status} />
          <span className="capitalize text-slate-400">{task.priority}</span>
        </div>
      </div>
    </article>
  );
}
