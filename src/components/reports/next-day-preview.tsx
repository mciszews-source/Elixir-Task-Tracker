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
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Top priorities for tomorrow</h2>
        <p className="text-sm text-slate-500">{dateLabel}</p>
      </header>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No upcoming priorities scheduled.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([teamName, teamTasks]) => (
            <div key={teamName}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {teamName}
              </h3>
              <ol className="space-y-2">
                {teamTasks.map((task, index) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
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
