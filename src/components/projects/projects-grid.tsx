import type { Project } from "@/types/database";
import { FolderKanban } from "lucide-react";

interface ProjectsGridProps {
  projects: Project[];
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-16 text-center">
        <FolderKanban className="mb-4 h-10 w-10 text-slate-400" />
        <h3 className="text-lg font-medium text-slate-900">No projects yet</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Projects group related tasks across initiatives. Create one when you are
          ready to track a larger effort.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">
            {project.description || "No description"}
          </p>
          <span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
            {project.status.replace("_", " ")}
          </span>
        </article>
      ))}
    </div>
  );
}
