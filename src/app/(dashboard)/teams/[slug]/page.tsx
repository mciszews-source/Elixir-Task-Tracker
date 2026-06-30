import { TopBar } from "@/components/layout/top-bar";
import { getMockTeamBySlug } from "@/lib/mock-data";
import { TeamBoardClient } from "@/components/teams/team-board-client";
import { notFound } from "next/navigation";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = getMockTeamBySlug(slug);

  if (!team) notFound();

  return (
    <>
      <TopBar
        title={team.name}
        subtitle="Drag to reprioritize · click to open task details"
      />
      <TeamBoardClient team={team} />
    </>
  );
}
