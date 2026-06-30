import type { TeamWithTasks } from "@/types/database";
import { TeamLane } from "@/components/teams/team-lane";

interface TaskBoardProps {
  teams: TeamWithTasks[];
  canReorderTeam: (teamId: string) => boolean;
  onReorder: (teamId: string, taskId: string, newIndex: number) => void;
}

export function TaskBoard({ teams, canReorderTeam, onReorder }: TaskBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {teams.map((team) => (
        <TeamLane
          key={team.id}
          team={team}
          canReorder={canReorderTeam(team.id)}
          onReorder={(taskId, newIndex) => onReorder(team.id, taskId, newIndex)}
        />
      ))}
    </div>
  );
}
