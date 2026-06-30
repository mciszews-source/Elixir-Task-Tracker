"use client";

import type { TaskPriority, TaskWithRelations } from "@/types/database";
import { cn, formatDueDate } from "@/lib/utils";
import { priorityLabels } from "@/lib/brand";

interface ElixirTaskRowProps {
  task: TaskWithRelations;
  rank: number;
  isDragging?: boolean;
  canEdit: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPriorityChange: (p: TaskPriority) => void;
}

export function ElixirTaskRow({
  task,
  rank,
  isDragging,
  canEdit,
  dragHandleProps,
  onToggleDone,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPriorityChange,
}: ElixirTaskRowProps) {
  const isDone = task.status === "done";
  const due = task.due_date;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = due && due < today && !isDone;

  return (
    <div
      className={cn(
        "task-p-" + task.priority,
        "glass-card relative flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all",
        "before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[3px] before:rounded-l-xl before:content-['']",
        !isDone && "hover:bg-white/12 hover:border-white/20",
        isDragging && "opacity-40",
        isDone && "opacity-50 bg-white/[0.04] border-white/[0.07]",
      )}
    >
      <button
        type="button"
        onClick={onToggleDone}
        disabled={!canEdit}
        className={cn(
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-xs transition-all",
          isDone
            ? "border-[#3DB87A] bg-[rgba(61,184,122,0.25)] text-[#7DDFAD]"
            : "border-white/25 text-transparent hover:border-[rgba(61,184,122,0.7)] hover:bg-[rgba(61,184,122,0.1)]",
        )}
      >
        {isDone ? "✓" : ""}
      </button>

      {!isDone && canEdit && (
        <button
          type="button"
          aria-label="Drag"
          className="cursor-grab text-base text-white/20 hover:text-white/50 active:cursor-grabbing"
          {...dragHandleProps}
        >
          ⠿
        </button>
      )}

      <span className="font-display w-5 shrink-0 text-center text-[11px] font-semibold text-white/30">
        {isDone ? "" : rank}
      </span>

      <select
        value={task.priority}
        disabled={!canEdit || isDone}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority)}
        className={cn(
          "font-display shrink-0 rounded-full border-none px-3 py-1 text-[10px] font-semibold tracking-wider uppercase outline-none",
          "priority-" + task.priority,
        )}
      >
        {(["critical", "high", "medium", "low"] as TaskPriority[]).map((p) => (
          <option key={p} value={p} className="bg-[#21264C] text-white">
            {priorityLabels[p]}
          </option>
        ))}
      </select>

      <span
        className={cn(
          "font-display min-w-0 flex-1 truncate text-[15px] font-medium",
          isDone
            ? "text-white/45 line-through"
            : "text-white/92",
        )}
      >
        {task.title}
      </span>

      {task.is_executive_request && (
        <span className="font-display shrink-0 rounded border border-white/20 bg-white/12 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white/55">
          EWAN
        </span>
      )}

      {task.description && (
        <span className="hidden min-w-0 flex-1 truncate text-xs text-white/38 italic xl:block">
          {task.description}
        </span>
      )}

      {due && (
        <span
          className={cn(
            "font-display shrink-0 text-[15px] font-semibold tracking-wide text-white/75",
            overdue && "text-[#FF8F9A]",
          )}
        >
          {overdue && (
            <span className="mr-2 rounded border border-[rgba(232,73,90,0.4)] bg-[rgba(232,73,90,0.25)] px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-[#FF8F9A]">
              OVERDUE
            </span>
          )}
          {formatDueDate(due)}
        </span>
      )}

      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          {!isDone && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={onMoveUp}
                className="rounded px-1 text-[13px] text-white/30 hover:bg-white/10 hover:text-white/85"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                className="rounded px-1 text-[13px] text-white/30 hover:bg-white/10 hover:text-white/85"
              >
                ▼
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg px-2 py-1.5 text-sm text-white/35 hover:bg-white/12 hover:text-white/90"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg px-2 py-1.5 text-sm text-white/25 hover:bg-[rgba(232,73,90,0.15)] hover:text-[#FF8F9A]"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
