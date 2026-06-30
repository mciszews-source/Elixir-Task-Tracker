import type { TeamWithTasks, TaskWithRelations, Project } from "@/types/database";

const MOCK_TEAMS = [
  { id: "1", name: "CEO Office", slug: "ceo-office", color: "#1e40af", sort_order: 0, created_at: "" },
  { id: "2", name: "Operations", slug: "operations", color: "#7c3aed", sort_order: 1, created_at: "" },
  { id: "3", name: "Finance", slug: "finance", color: "#059669", sort_order: 2, created_at: "" },
  { id: "4", name: "Engineering", slug: "engineering", color: "#dc2626", sort_order: 3, created_at: "" },
];

function makeTask(
  partial: Partial<TaskWithRelations> & Pick<TaskWithRelations, "id" | "title" | "team_id">,
): TaskWithRelations {
  const team = MOCK_TEAMS.find((t) => t.id === partial.team_id);
  return {
    description: "",
    status: "in_progress",
    priority: "high",
    sort_order: 1000,
    assignee_id: null,
    due_date: null,
    is_on_board: true,
    is_executive_request: false,
    completed_at: null,
    created_by: null,
    project_id: null,
    external_id: null,
    external_source: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    team,
    assignee: { id: "u1", full_name: "Ivan", email: "ivan@elixir.com" },
    ...partial,
  };
}

export const MOCK_DASHBOARD: TeamWithTasks[] = [
  {
    ...MOCK_TEAMS[0],
    board_tasks: [
      makeTask({
        id: "t1",
        team_id: "1",
        title: "Finalize board deck for investor meeting",
        status: "in_progress",
        priority: "critical",
        sort_order: 1000,
        due_date: "2026-07-02",
      }),
      makeTask({
        id: "t2",
        team_id: "1",
        title: "Review weekly leadership priorities",
        status: "open",
        sort_order: 2000,
      }),
    ],
    open_tasks: [
      makeTask({
        id: "t3",
        team_id: "1",
        title: "Schedule Q3 planning offsite",
        status: "open",
        is_on_board: false,
      }),
    ],
  },
  {
    ...MOCK_TEAMS[1],
    board_tasks: [
      makeTask({
        id: "t4",
        team_id: "2",
        title: "Vendor contract renewal — facilities",
        status: "blocked",
        priority: "high",
        sort_order: 1000,
        assignee: { id: "u2", full_name: "Marek", email: "marek@elixir.com" },
      }),
    ],
    open_tasks: [],
  },
  {
    ...MOCK_TEAMS[2],
    board_tasks: [
      makeTask({
        id: "t5",
        team_id: "3",
        title: "Close June financials",
        status: "in_progress",
        sort_order: 1000,
      }),
    ],
    open_tasks: [
      makeTask({
        id: "t6",
        team_id: "3",
        title: "Update cash flow forecast",
        status: "open",
        is_on_board: false,
      }),
    ],
  },
  {
    ...MOCK_TEAMS[3],
    board_tasks: [
      makeTask({
        id: "t7",
        team_id: "4",
        title: "Ship dashboard MVP to staging",
        status: "in_progress",
        priority: "critical",
        sort_order: 1000,
      }),
    ],
    open_tasks: [],
  },
];

export const MOCK_COMPLETED_TODAY: TaskWithRelations[] = [
  makeTask({
    id: "c1",
    team_id: "2",
    title: "Approve facilities budget revision",
    status: "done",
    completed_at: new Date().toISOString(),
  }),
  makeTask({
    id: "c2",
    team_id: "1",
    title: "Send weekly update to leadership",
    status: "done",
    completed_at: new Date().toISOString(),
  }),
];

export const MOCK_TOP_TOMORROW: TaskWithRelations[] = MOCK_DASHBOARD.flatMap(
  (team) => team.board_tasks.slice(0, 2),
).slice(0, 6);

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    team_id: "1",
    name: "Q3 Board Prep",
    description: "Investor and board meeting preparation",
    status: "active",
    created_at: "",
    updated_at: "",
  },
];

export function getMockTeamBySlug(slug: string): TeamWithTasks | undefined {
  return MOCK_DASHBOARD.find((t) => t.slug === slug);
}
