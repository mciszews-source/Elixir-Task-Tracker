"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { priorityLabels } from "@/lib/brand";
import { formatDueDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types/database";

export default function DailyReportPage() {
  const today = format(new Date(), "MMMM d, yyyy");
  const tomorrow = format(new Date(Date.now() + 86400000), "MMMM d, yyyy");

  const { data, isLoading } = useQuery({
    queryKey: ["daily-report"],
    queryFn: async () => {
      const res = await fetch("/api/reports/daily");
      const json = await res.json();
      return json.data as {
        completed_today: TaskWithRelations[];
        top_tomorrow: TaskWithRelations[];
      };
    },
  });

  if (isLoading) {
    return <p className="font-display text-sm tracking-widest text-white/30">Loading…</p>;
  }

  const completed = data?.completed_today ?? [];
  const tomorrowTasks = data?.top_tomorrow ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ReportSection title="Completed today" dateLabel={today} tasks={completed} mode="done" />
      <ReportSection title="Top priorities for tomorrow" dateLabel={tomorrow} tasks={tomorrowTasks} mode="top" />
    </div>
  );
}

function ReportSection({
  title,
  dateLabel,
  tasks,
  mode,
}: {
  title: string;
  dateLabel: string;
  tasks: TaskWithRelations[];
  mode: "done" | "top";
}) {
  return (
    <section className="glass-panel-strong rounded-[14px] p-6">
      <h2 className="font-display text-lg font-light tracking-[0.12em] text-white">
        {title}
      </h2>
      <p className="font-display mt-1 text-[11px] tracking-[0.18em] text-white/45 uppercase">
        {dateLabel}
      </p>

      {tasks.length === 0 ? (
        <p className="font-display mt-6 text-[12px] tracking-widest text-white/30 uppercase">
          No items
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {tasks.map((task, i) => (
            <li
              key={task.id}
              className="glass-card flex items-start gap-3 rounded-[10px] px-4 py-3"
            >
              {mode === "top" ? (
                <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(74,120,196,0.4)] bg-[rgba(74,120,196,0.30)] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              ) : (
                <span className="text-[#7DDFAD]">✓</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white/92">
                  {task.title}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {task.team?.name}
                  {task.due_date && ` · Due ${formatDueDate(task.due_date)}`}
                  {mode === "top" && ` · ${priorityLabels[task.priority]}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
