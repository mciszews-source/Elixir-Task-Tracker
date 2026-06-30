"use client";

import { useState } from "react";
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
import { ElixirTaskRow } from "@/components/tracker/elixir-task-row";
import { EodStrip } from "@/components/tracker/eod-strip";
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
  handlers,
}: {
  task: TaskWithRelations;
  rank: number;
  canEdit: boolean;
  handlers: {
    onToggleDone: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onPriorityChange: (p: TaskPriority) => void;
  };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canEdit });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <ElixirTaskRow
        task={task}
        rank={rank}
        isDragging={isDragging}
        canEdit={canEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...handlers}
      />
    </div>
  );
}

export function TeamTracker({ team, role, userTeamIds }: TeamTrackerProps) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newRisk, setNewRisk] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("high");
  const [newDue, setNewDue] = useState(new Date().toISOString().slice(0, 10));
  const [executiveFlag, setExecutiveFlag] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const canEdit = canReprioritizeTeam(role, userTeamIds, team.id) || role === "member";

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
          title: newTitle,
          description: newRisk,
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
      invalidate();
    },
  });

  const patchTask = useMutation({
    mutationFn: async (body: {
      id: string;
      status?: string;
      priority?: TaskPriority;
      title?: string;
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
    (t) => t.due_date && t.due_date < new Date().toISOString().slice(0, 10),
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

  if (isLoading) {
    return <p className="font-display text-sm tracking-widest text-white/30">Loading…</p>;
  }

  return (
    <div>
      {/* Add row */}
      {canEdit && (
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <input
            className="glass-input inp-name min-w-[180px] flex-[2] rounded-[10px] px-4 py-2.5 text-sm"
            placeholder="New task…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newTitle && createTask.mutate()}
          />
          <input
            type="date"
            className="glass-input rounded-[10px] px-3 py-2.5 text-sm"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
          />
          <select
            className="glass-input w-[130px] cursor-pointer rounded-[10px] px-3 py-2.5 text-sm"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          >
            <option value="critical" className="bg-[#21264C]">Critical</option>
            <option value="high" className="bg-[#21264C]">High</option>
            <option value="medium" className="bg-[#21264C]">Medium</option>
            <option value="low" className="bg-[#21264C]">Low</option>
          </select>
          <input
            className="glass-input min-w-[160px] flex-[1.5] rounded-[10px] px-4 py-2.5 text-sm"
            placeholder="Risk if delayed…"
            value={newRisk}
            onChange={(e) => setNewRisk(e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs whitespace-nowrap text-white/45">
            <input
              type="checkbox"
              checked={executiveFlag}
              onChange={(e) => setExecutiveFlag(e.target.checked)}
            />
            Ewan&apos;s request
          </label>
          <button
            type="button"
            onClick={() => newTitle && createTask.mutate()}
            className="font-display rounded-[10px] border border-white/35 bg-white/18 px-5 py-2.5 text-xs font-semibold tracking-wider text-white transition hover:bg-white/28"
          >
            + ADD
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
        <p className="py-12 text-center font-display text-[13px] tracking-widest text-white/25">
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
                  handlers={{
                    onToggleDone: () =>
                      patchTask.mutate({ id: task.id, status: "done" }),
                    onEdit: () => {
                      const title = prompt("Task name", task.title);
                      if (title) patchTask.mutate({ id: task.id, title });
                    },
                    onDelete: () => {
                      if (confirm("Delete this task?")) deleteTask.mutate(task.id);
                    },
                    onMoveUp: () => moveTask(task.id, -1),
                    onMoveDown: () => moveTask(task.id, 1),
                    onPriorityChange: (p) => patchTask.mutate({ id: task.id, priority: p }),
                  }}
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
            onClick={() => setShowCompleted(!showCompleted)}
            className="mt-6 mb-3 flex w-full items-center gap-3"
          >
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-display flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30">
              <span className={showCompleted ? "" : "-rotate-90"}>▾</span>
              COMPLETED
              <span className="rounded-[10px] border border-[rgba(61,184,122,0.25)] bg-[rgba(61,184,122,0.15)] px-2 py-0.5 text-[10px] text-[rgba(61,184,122,0.7)]">
                {done.length}
              </span>
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </button>
          {showCompleted && (
            <div className="flex flex-col gap-2">
              {done.map((task, i) => (
                <ElixirTaskRow
                  key={task.id}
                  task={task}
                  rank={i + 1}
                  canEdit={canEdit}
                  onToggleDone={() => patchTask.mutate({ id: task.id, status: "open" })}
                  onEdit={() => {}}
                  onDelete={() => deleteTask.mutate(task.id)}
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
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs text-white/60 ${
        highlight ? "border-[rgba(232,73,90,0.35)]" : "border-white/12 bg-white/8"
      }`}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      <span className={highlight ? "text-[#FF8F9A]" : ""}>{label}</span>
    </div>
  );
}
