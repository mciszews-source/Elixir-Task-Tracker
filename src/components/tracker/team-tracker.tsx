"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TaskPriority,
  TaskWithRelations,
  Team,
  UserRole,
} from "@/types/database";
import {
  ElixirTaskRow,
  type TaskEditPayload,
} from "@/components/tracker/elixir-task-row";
import { EodStrip } from "@/components/tracker/eod-strip";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { canReprioritizeTeam } from "@/lib/permissions";

interface TeamTrackerProps {
  team: Team;
  role: UserRole;
  userTeamIds: string[];
}

function SortableRow({
  task,
  rank,
  canEdit,
  editing,
  handlers,
}: {
  task: TaskWithRelations;
  rank: number;
  canEdit: boolean;
  editing: boolean;
  handlers: {
    onToggleDone: () => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: (p: TaskEditPayload) => void;
    onRequestDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onPriorityChange: (p: TaskPriority) => void;
  };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canEdit || editing });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <ElixirTaskRow
        task={task}
        rank={rank}
        isDragging={isDragging}
        canEdit={canEdit}
        editing={editing}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...handlers}
      />
    </div>
  );
}

const COLLAPSE_STORAGE = "elixir_completed_collapsed_v1";

function loadCollapsedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveCollapsedMap(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSE_STORAGE, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function TeamTracker({ team, role, userTeamIds }: TeamTrackerProps) {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [newTitle, setNewTitle] = useState("");
  const [newRisk, setNewRisk] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("high");
  const [newDue, setNewDue] = useState(todayStr);
  const [executiveFlag, setExecutiveFlag] = useState(false);

  // Per-tab persistent collapse state.
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setCollapsedMap(loadCollapsedMap());
  }, []);
  const completedCollapsed = collapsedMap[team.slug] ?? false;
  function toggleCompleted() {
    const next = { ...collapsedMap, [team.slug]: !completedCollapsed };
    setCollapsedMap(next);
    saveCollapsedMap(next);
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskWithRelations | null>(null);

  const canEdit =
    canReprioritizeTeam(role, userTeamIds, team.id) ||
    role === "member" ||
    role === "admin" ||
    role === "executive";

  const { data, isLoading } = useQuery({
    queryKey: ["team-tasks", team.id],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${team.slug}/tasks`);
      const json = await res.json();
      return json.data as { active: TaskWithRelations[]; done: TaskWithRelations[] };
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["team-tasks", team.id] });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: team.id,
          title: newTitle.trim(),
          description: newRisk.trim(),
          priority: newPriority,
          due_date: newDue,
          is_on_board: true,
          is_executive_request: executiveFlag,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      setNewTitle("");
      setNewRisk("");
      setExecutiveFlag(false);
      invalidate();
    },
  });

  const patchTask = useMutation({
    mutationFn: async (body: {
      id: string;
      status?: string;
      priority?: TaskPriority;
      title?: string;
      description?: string;
      due_date?: string;
      is_executive_request?: boolean;
    }) => {
      const { id, ...updates } = body;
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (payload: {
      task_id: string;
      neighbor_before?: number;
      neighbor_after?: number;
    }) => {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: team.id, ...payload }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    },
    onSuccess: invalidate,
  });

  const active = data?.active ?? [];
  const done = data?.done ?? [];

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  active.forEach((t) => counts[t.priority]++);
  const overdue = active.filter(
    (t) => t.due_date && t.due_date < todayStr,
  ).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id) return;
    const oldIndex = active.findIndex((t) => t.id === dragged.id);
    const newIndex = active.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...active];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorder.mutate({
      task_id: String(dragged.id),
      neighbor_before: reordered[newIndex - 1]?.sort_order,
      neighbor_after: reordered[newIndex + 1]?.sort_order,
    });
  }

  function moveTask(id: string, direction: -1 | 1) {
    const idx = active.findIndex((t) => t.id === id);
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= active.length) return;
    const reordered = [...active];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIndex, 0, moved);
    reorder.mutate({
      task_id: id,
      neighbor_before: reordered[newIndex - 1]?.sort_order,
      neighbor_after: reordered[newIndex + 1]?.sort_order,
    });
  }

  function handlersFor(task: TaskWithRelations) {
    return {
      onToggleDone: () =>
        patchTask.mutate({
          id: task.id,
          status: task.status === "done" ? "open" : "done",
        }),
      onStartEdit: () => setEditingId(task.id),
      onCancelEdit: () => setEditingId(null),
      onSaveEdit: (p: TaskEditPayload) => {
        patchTask.mutate({
          id: task.id,
          title: p.title,
          description: p.description,
          due_date: p.due_date,
          priority: p.priority,
          is_executive_request: p.is_executive_request,
        });
        setEditingId(null);
      },
      onRequestDelete: () => setPendingDelete(task),
      onMoveUp: () => moveTask(task.id, -1),
      onMoveDown: () => moveTask(task.id, 1),
      onPriorityChange: (p: TaskPriority) =>
        patchTask.mutate({ id: task.id, priority: p }),
    };
  }

  if (isLoading) {
    return (
      <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
        Loading…
      </p>
    );
  }

  return (
    <div>
      {/* Add row */}
      {canEdit && (
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <input
            className="glass-input min-w-[200px] flex-[2] rounded-[10px] px-4 py-[11px] text-sm"
            placeholder="New task…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && newTitle.trim() && createTask.mutate()
            }
          />
          <DatePickerPopover value={newDue} onChange={setNewDue} />
          <select
            className="elixir-select w-[140px] rounded-[10px] px-3 py-[11px] text-sm"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            aria-label="Priority"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="glass-input min-w-[180px] flex-[1.5] rounded-[10px] px-4 py-[11px] text-sm"
            placeholder="Risk if delayed…"
            value={newRisk}
            onChange={(e) => setNewRisk(e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 px-2 text-[11px] tracking-wide whitespace-nowrap text-white/55 select-none">
            <input
              type="checkbox"
              className="elixir-check"
              checked={executiveFlag}
              onChange={(e) => setExecutiveFlag(e.target.checked)}
            />
            Ewan&apos;s request
          </label>
          <button
            type="button"
            onClick={() => newTitle.trim() && createTask.mutate()}
            disabled={!newTitle.trim() || createTask.isPending}
            className="elixir-btn elixir-btn-primary"
          >
            {createTask.isPending ? "Adding…" : "+ Add"}
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-5 flex flex-wrap gap-3">
        {counts.critical > 0 && (
          <StatPill color="var(--elixir-red)" label={`${counts.critical} critical`} />
        )}
        {counts.high > 0 && (
          <StatPill color="var(--elixir-amber)" label={`${counts.high} high`} />
        )}
        {counts.medium > 0 && (
          <StatPill color="var(--elixir-blue)" label={`${counts.medium} medium`} />
        )}
        {counts.low > 0 && (
          <StatPill color="var(--elixir-green)" label={`${counts.low} low`} />
        )}
        {overdue > 0 && (
          <StatPill color="var(--elixir-red)" label={`${overdue} overdue`} highlight />
        )}
      </div>

      {/* Active tasks */}
      {active.length === 0 ? (
        <p className="font-display py-12 text-center text-[13px] tracking-widest text-white/25">
          NO TASKS — ADD ONE ABOVE
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {active.map((task, i) => (
                <SortableRow
                  key={task.id}
                  task={task}
                  rank={i + 1}
                  canEdit={canEdit}
                  editing={editingId === task.id}
                  handlers={handlersFor(task)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <>
          <button
            type="button"
            onClick={toggleCompleted}
            className="mt-6 mb-3 flex w-full items-center gap-3"
          >
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-display flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30">
              <span className={completedCollapsed ? "-rotate-90" : ""}>▾</span>
              COMPLETED
              <span className="rounded-[10px] border border-[rgba(61,184,122,0.25)] bg-[rgba(61,184,122,0.15)] px-2 py-0.5 text-[10px] text-[rgba(61,184,122,0.7)]">
                {done.length}
              </span>
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </button>
          {!completedCollapsed && (
            <div className="flex flex-col gap-2">
              {done.map((task, i) => (
                <ElixirTaskRow
                  key={task.id}
                  task={task}
                  rank={i + 1}
                  canEdit={canEdit}
                  editing={false}
                  onToggleDone={() =>
                    patchTask.mutate({ id: task.id, status: "open" })
                  }
                  onStartEdit={() => {}}
                  onCancelEdit={() => {}}
                  onSaveEdit={() => {}}
                  onRequestDelete={() => setPendingDelete(task)}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  onPriorityChange={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}

      <EodStrip teamName={team.name} tasks={[...active, ...done]} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete task?"
        detail={pendingDelete?.title}
        confirmLabel="Delete"
        variant="danger"
        icon="🗑"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteTask.mutate(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}

function StatPill({
  color,
  label,
  highlight,
}: {
  color: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "elixir-pill elixir-pill-danger" : "elixir-pill"}>
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
