import type { TaskWithRelations } from "@/types/database";
import { CheckCircle2 } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";

interface DailyReportProps {
  tasks: TaskWithRelations[];
  dateLabel: string;
}

export function DailyReport({ tasks, dateLabel }: DailyReportProps) {
  const grouped = tasks.reduce<Record<string, TaskWithRelations[]>>((acc, task) => {
    const key = task.team?.name ?? "Unassigned";
    acc[key] = acc[key] ?? [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Completed today</h2>
        <p className="text-sm text-slate-500">{dateLabel}</p>
      </header>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks completed yet today.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([teamName, teamTasks]) => (
            <div key={teamName}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {teamName}
              </h3>
              <ul className="space-y-2">
                {teamTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        {task.assignee?.full_name && <span>{task.assignee.full_name}</span>}
                        <StatusPill status={task.status} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
