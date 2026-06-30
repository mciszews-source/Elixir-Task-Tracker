"use client";

import { useEffect, useRef, useState } from "react";
import type { TaskPriority, TaskWithRelations } from "@/types/database";
import { cn, formatDueDate } from "@/lib/utils";
import { priorityLabels } from "@/lib/brand";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";

export interface TaskEditPayload {
  title: string;
  due_date: string;
  priority: TaskPriority;
  description: string;
  is_executive_request: boolean;
}

interface ElixirTaskRowProps {
  task: TaskWithRelations;
  rank: number;
  isDragging?: boolean;
  canEdit: boolean;
  editing: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onToggleDone: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (payload: TaskEditPayload) => void;
  onRequestDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPriorityChange: (p: TaskPriority) => void;
}

export function ElixirTaskRow({
  task,
  rank,
  isDragging,
  canEdit,
  editing,
  dragHandleProps,
  onToggleDone,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
  onMoveUp,
  onMoveDown,
  onPriorityChange,
}: ElixirTaskRowProps) {
  const isDone = task.status === "done";
  const due = task.due_date;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = due && due < today && !isDone;

  // ─ Edit state (only meaningful when `editing` is true) ────────────────
  const [name, setName] = useState(task.title);
  const [date, setDate] = useState(task.due_date ?? today);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [risk, setRisk] = useState(task.description ?? "");
  const [fromEwan, setFromEwan] = useState(task.is_executive_request);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset local state every time we enter edit mode.
  useEffect(() => {
    if (editing) {
      setName(task.title);
      setDate(task.due_date ?? today);
      setPriority(task.priority);
      setRisk(task.description ?? "");
      setFromEwan(task.is_executive_request);
      requestAnimationFrame(() => {
        nameRef.current?.focus();
        nameRef.current?.select();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, task.id]);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSaveEdit({
      title: trimmed,
      due_date: date || today,
      priority,
      description: risk.trim(),
      is_executive_request: fromEwan,
    });
  }

  return (
    <div
      className={cn(
        "task-p-" + task.priority,
        "glass-card relative flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all",
        "before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[3px] before:rounded-l-xl before:content-['']",
        !isDone && !editing && "hover:border-white/20 hover:bg-white/[0.12]",
        isDragging && "opacity-40",
        editing && "border-white/30 bg-white/[0.13]",
        isDone && !editing && "border-white/[0.07] bg-white/[0.04] opacity-50",
      )}
    >
      <button
        type="button"
        onClick={onToggleDone}
        disabled={!canEdit || editing}
        aria-label={isDone ? "Mark open" : "Mark done"}
        className={cn(
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[12px] transition-all",
          isDone
            ? "border-[#3DB87A] bg-[rgba(61,184,122,0.25)] text-[#7DDFAD]"
            : "border-white/25 text-transparent hover:border-[rgba(61,184,122,0.7)] hover:bg-[rgba(61,184,122,0.1)] hover:text-[rgba(61,184,122,0.55)]",
          editing && "opacity-30",
        )}
      >
        ✓
      </button>

      {!isDone && (
        <button
          type="button"
          aria-label="Drag to reorder"
          disabled={editing || !canEdit}
          className={cn(
            "-mx-1 cursor-grab rounded text-base leading-none text-white/20 transition active:cursor-grabbing",
            !editing && canEdit && "hover:text-white/55",
            (editing || !canEdit) && "opacity-30 cursor-default",
          )}
          {...(editing || !canEdit ? {} : dragHandleProps)}
        >
          ⠿
        </button>
      )}

      <span className="font-display w-5 shrink-0 text-center text-[11px] font-semibold text-white/30 tabular-nums">
        {isDone || editing ? "" : rank}
      </span>

      {/* ─ VIEW MODE ─────────────────────────────────────── */}
      {!editing && (
        <>
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
            title={task.title}
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
            <span
              className="hidden min-w-0 max-w-[28%] flex-1 truncate text-xs text-white/40 italic xl:block"
              title={task.description}
            >
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
              {!isDone && (
                <button
                  type="button"
                  onClick={onStartEdit}
                  aria-label="Edit"
                  className="elixir-icon-btn"
                >
                  ✎
                </button>
              )}
              <button
                type="button"
                onClick={onRequestDelete}
                aria-label="Delete"
                className="elixir-icon-btn danger"
              >
                ✕
              </button>
            </div>
          )}
        </>
      )}

      {/* ─ EDIT MODE ─────────────────────────────────────── */}
      {editing && (
        <>
          <input
            ref={nameRef}
            type="text"
            className="glass-input min-w-[140px] flex-[2] rounded-[8px] px-3 py-[7px] text-[13px]"
            placeholder="Task name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <DatePickerPopover small value={date} onChange={setDate} />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            aria-label="Priority"
            className="elixir-select w-[110px] rounded-[8px] px-3 py-[7px] text-[11px] font-semibold tracking-[0.06em]"
          >
            {(["critical", "high", "medium", "low"] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {priorityLabels[p]}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="glass-input min-w-[120px] flex-[1.5] rounded-[8px] px-3 py-[7px] text-[13px]"
            placeholder="Risk if delayed…"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] whitespace-nowrap text-white/55 select-none">
            <input
              type="checkbox"
              className="elixir-check"
              checked={fromEwan}
              onChange={(e) => setFromEwan(e.target.checked)}
            />
            Ewan
          </label>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={save}
              aria-label="Save"
              className="elixir-icon-btn"
              style={{ color: "#7DDFAD" }}
            >
              ✓
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              aria-label="Cancel"
              className="elixir-icon-btn"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
