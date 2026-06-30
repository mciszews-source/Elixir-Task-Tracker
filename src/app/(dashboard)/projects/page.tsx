import { ProjectsGrid } from "@/components/projects/projects-grid";
import { TopBar } from "@/components/layout/top-bar";
import { MOCK_PROJECTS } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <>
      <TopBar
        title="Projects"
        subtitle="Group tasks under larger initiatives"
      />

      <div className="flex-1 p-8">
        <ProjectsGrid projects={MOCK_PROJECTS} />
      </div>
    </>
  );
}
