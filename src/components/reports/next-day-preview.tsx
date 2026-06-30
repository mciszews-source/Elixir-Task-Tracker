import type { TaskWithRelations } from "@/types/database";
import { formatDueDate } from "@/lib/utils";

interface NextDayPreviewProps {
  tasks: TaskWithRelations[];
  dateLabel: string;
}

export function NextDayPreview({ tasks, dateLabel }: NextDayPreviewProps) {
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
          Top priorities for tomorrow
        </h2>
        <p className="mt-1 text-sm text-white/45">{dateLabel}</p>
      </header>

      {tasks.length === 0 ? (
        <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
          No upcoming priorities scheduled
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([teamName, teamTasks]) => (
            <div key={teamName}>
              <h3 className="font-display mb-3 text-[10px] font-bold tracking-[0.22em] text-white/50 uppercase">
                {teamName}
              </h3>
              <ol className="space-y-2">
                {teamTasks.map((task, index) => (
                  <li
                    key={task.id}
                    className="glass-card flex items-start gap-3 rounded-[10px] px-4 py-3"
                  >
                    <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(74,120,196,0.4)] bg-[rgba(74,120,196,0.30)] text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white/90">{task.title}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {task.assignee?.full_name ?? "Unassigned"}
                        {task.due_date && ` · Due ${formatDueDate(task.due_date)}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
