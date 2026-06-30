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
        !isDone && "hover:border-white/20 hover:bg-white/[0.12]",
        isDragging && "opacity-40",
        isDone && "border-white/[0.07] bg-white/[0.04] opacity-50",
      )}
    >
      <button
        type="button"
        onClick={onToggleDone}
        disabled={!canEdit}
        aria-label={isDone ? "Mark open" : "Mark done"}
        className={cn(
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[12px] transition-all",
          isDone
            ? "border-[#3DB87A] bg-[rgba(61,184,122,0.25)] text-[#7DDFAD]"
            : "border-white/25 text-transparent hover:border-[rgba(61,184,122,0.7)] hover:bg-[rgba(61,184,122,0.1)] hover:text-[rgba(61,184,122,0.55)]",
        )}
      >
        ✓
      </button>

      {!isDone && canEdit && (
        <button
          type="button"
          aria-label="Drag to reorder"
          className="-mx-1 cursor-grab rounded text-base leading-none text-white/20 transition hover:text-white/55 active:cursor-grabbing"
          {...dragHandleProps}
        >
          ⠿
        </button>
      )}

      <span className="font-display w-5 shrink-0 text-center text-[11px] font-semibold text-white/30 tabular-nums">
        {isDone ? "" : rank}
      </span>

      <select
        value={task.priority}
        disabled={!canEdit || isDone}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority)}
        aria-label="Priority"
        className={cn(
          "font-display elixir-priority-select shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase outline-none",
          "priority-" + task.priority,
          isDone && "opacity-40",
        )}
      >
        {(["critical", "high", "medium", "low"] as TaskPriority[]).map((p) => (
          <option key={p} value={p}>
            {priorityLabels[p]}
          </option>
        ))}
      </select>

      <span
        className={cn(
          "font-display min-w-0 flex-1 truncate text-[15px] font-medium tracking-[0.005em]",
          isDone ? "text-white/45 line-through" : "text-white/90",
        )}
      >
        {task.title}
      </span>

      {task.is_executive_request && (
        <span
          className="font-display shrink-0 rounded-[4px] border border-white/20 bg-white/[0.12] px-1.5 py-[2px] text-[9px] font-bold tracking-[0.08em] text-white/55"
          title="Ewan's request"
        >
          EWAN
        </span>
      )}

      {task.description && (
        <span className="hidden min-w-0 max-w-[28%] flex-1 truncate text-xs text-white/40 italic xl:block">
          {task.description}
        </span>
      )}

      {due && (
        <span
          className={cn(
            "font-display flex shrink-0 items-center gap-2 text-[14px] font-semibold tracking-[0.04em]",
            overdue ? "text-[#FF8F9A]" : "text-white/75",
            isDone && "text-white/30",
          )}
        >
          {overdue && (
            <span className="font-display rounded-[5px] border border-[rgba(232,73,90,0.4)] bg-[rgba(232,73,90,0.25)] px-2 py-[2px] text-[10px] font-bold tracking-[0.1em] text-[#FF8F9A]">
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
                aria-label="Move up"
                className="rounded px-1 text-[13px] leading-none text-white/30 transition hover:bg-white/10 hover:text-white/85"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                aria-label="Move down"
                className="rounded px-1 text-[13px] leading-none text-white/30 transition hover:bg-white/10 hover:text-white/85"
              >
                ▼
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            className="elixir-icon-btn"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete"
            className="elixir-icon-btn danger"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
