export type UserRole =
  | "admin"
  | "executive"
  | "team_lead"
  | "member"
  | "viewer";

export type TaskStatus = "open" | "in_progress" | "blocked" | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type ProjectStatus = "active" | "on_hold" | "completed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  team_id: string | null;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  team_id: string;
  project_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  sort_order: number;
  assignee_id: string | null;
  due_date: string | null;
  is_on_board: boolean;
  completed_at: string | null;
  created_by: string | null;
  external_id: string | null;
  external_source: "asana" | "microsoft" | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  team?: Team;
  assignee?: Pick<Profile, "id" | "full_name" | "email"> | null;
  project?: Pick<Project, "id" | "name"> | null;
}

export interface ActivityLogEntry {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TeamWithTasks extends Team {
  board_tasks: TaskWithRelations[];
  open_tasks: TaskWithRelations[];
}

export interface DashboardData {
  teams: TeamWithTasks[];
  generated_at: string;
}

export interface DailyReportData {
  date: string;
  timezone: string;
  completed_today: TaskWithRelations[];
  top_tomorrow: TaskWithRelations[];
}

export interface ReorderTasksPayload {
  team_id: string;
  task_id: string;
  new_sort_order?: number;
  neighbor_before?: number;
  neighbor_after?: number;
  target_team_id?: string;
}

export interface CreateTaskPayload {
  team_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  project_id?: string | null;
  due_date?: string | null;
  is_on_board?: boolean;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  project_id?: string | null;
  due_date?: string | null;
  is_on_board?: boolean;
  sort_order?: number;
  team_id?: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  is_lead: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      teams: { Row: Team; Insert: Partial<Team>; Update: Partial<Team> };
      team_members: {
        Row: TeamMember;
        Insert: Partial<TeamMember>;
        Update: Partial<TeamMember>;
      };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Partial<ActivityLogEntry>;
        Update: Partial<ActivityLogEntry>;
      };
    };
  };
}
