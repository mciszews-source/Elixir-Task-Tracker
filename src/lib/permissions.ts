import type { UserRole } from "@/types/database";

export const ADMIN_EMAILS = ["marek@elixir.com", "ivan@elixir.com"] as const;

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}

export function canViewAllTeams(role: UserRole): boolean {
  return role === "admin" || role === "executive";
}

export function canReprioritizeTeam(
  role: UserRole,
  userTeamIds: string[],
  targetTeamId: string,
): boolean {
  if (role === "admin") return true;
  if (role === "team_lead" && userTeamIds.includes(targetTeamId)) return true;
  return false;
}

export function canReprioritizeCrossTeam(role: UserRole): boolean {
  return role === "admin";
}

export function canCreateTask(role: UserRole): boolean {
  return ["admin", "team_lead", "member"].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canManageIntegrations(role: UserRole): boolean {
  return role === "admin";
}
