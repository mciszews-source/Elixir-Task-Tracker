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
    <section className="glass-panel-strong rounded-[14px] p-6">
      <header className="mb-6">
        <h2 className="font-display text-xl font-light tracking-[0.12em] text-white">
          Completed today
        </h2>
        <p className="mt-1 text-sm text-white/45">{dateLabel}</p>
      </header>

      {tasks.length === 0 ? (
        <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
          No tasks completed yet today
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([teamName, teamTasks]) => (
            <div key={teamName}>
              <h3 className="font-display mb-3 text-[10px] font-bold tracking-[0.22em] text-white/50 uppercase">
                {teamName}
              </h3>
              <ul className="space-y-2">
                {teamTasks.map((task) => (
                  <li
                    key={task.id}
                    className="glass-card flex items-start gap-3 rounded-[10px] px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7DDFAD]" />
                    <div>
                      <p className="font-medium text-white/90">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                        {task.assignee?.full_name && (
                          <span>{task.assignee.full_name}</span>
                        )}
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
