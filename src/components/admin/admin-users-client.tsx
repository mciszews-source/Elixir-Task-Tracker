"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile, Team, UserRole } from "@/types/database";

interface UserWithTeams extends Profile {
  teams: { team_id: string; is_lead: boolean; team: Team }[];
}

export function AdminUsersClient() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [teamId, setTeamId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      return json.data as { users: UserWithTeams[]; teams: Team[] };
    },
  });

  const invite = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: name,
          role,
          team_id: teamId || undefined,
          is_lead: role === "team_lead",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Invite failed");
      return json;
    },
    onSuccess: () => {
      setEmail("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      role?: UserRole;
      team_id?: string;
      remove_team_id?: string;
    }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (isLoading) {
    return <p className="font-display text-sm tracking-widest text-white/30">Loading…</p>;
  }

  const users = data?.users ?? [];
  const teams = data?.teams ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-xl font-light tracking-[0.18em] text-white">
        Team Access
      </h1>
      <p className="mt-2 text-sm text-white/45">
        Invite users, assign roles, and manage department access — no SQL required.
      </p>

      {/* Invite form */}
      <div className="mt-8 rounded-[14px] border border-white/12 bg-white/8 p-6 backdrop-blur-md">
        <h2 className="font-display text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">
          Invite new user
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="glass-input min-w-[200px] flex-1 rounded-[10px] px-4 py-2.5 text-sm"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="glass-input min-w-[160px] rounded-[10px] px-4 py-2.5 text-sm"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="glass-input rounded-[10px] px-3 py-2.5 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="member" className="bg-[#21264C]">Member</option>
            <option value="team_lead" className="bg-[#21264C]">Team Lead</option>
            <option value="executive" className="bg-[#21264C]">Executive</option>
            <option value="admin" className="bg-[#21264C]">Admin</option>
            <option value="viewer" className="bg-[#21264C]">Viewer</option>
          </select>
          <select
            className="glass-input rounded-[10px] px-3 py-2.5 text-sm"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="" className="bg-[#21264C]">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#21264C]">
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!email || invite.isPending}
            onClick={() => invite.mutate()}
            className="font-display rounded-[10px] border border-white/35 bg-white/18 px-5 py-2.5 text-xs font-semibold tracking-wider text-white transition hover:bg-white/28 disabled:opacity-50"
          >
            {invite.isPending ? "Sending…" : "Send invite"}
          </button>
        </div>
        {invite.isError && (
          <p className="mt-3 text-sm text-[#FF8F9A]">{invite.error.message}</p>
        )}
        {invite.isSuccess && (
          <p className="mt-3 text-sm text-[#7DDFAD]">Invitation sent.</p>
        )}
      </div>

      {/* User list */}
      <div className="mt-8 flex flex-col gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4"
          >
            <div>
              <p className="font-display text-sm font-medium text-white/90">
                {user.full_name || user.email}
              </p>
              <p className="text-xs text-white/40">{user.email}</p>
              <p className="mt-1 font-display text-[10px] tracking-wider text-white/50 uppercase">
                {user.role}
                {user.teams.length > 0 &&
                  ` · ${user.teams.map((t) => t.team?.name).join(", ")}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="glass-input rounded-lg px-2 py-1.5 text-xs"
                value={user.role}
                onChange={(e) =>
                  updateUser.mutate({
                    id: user.id,
                    role: e.target.value as UserRole,
                  })
                }
              >
                {(["admin", "executive", "team_lead", "member", "viewer"] as UserRole[]).map(
                  (r) => (
                    <option key={r} value={r} className="bg-[#21264C]">
                      {r}
                    </option>
                  ),
                )}
              </select>
              <select
                className="glass-input rounded-lg px-2 py-1.5 text-xs"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    updateUser.mutate({ id: user.id, team_id: e.target.value });
                    e.target.value = "";
                  }
                }}
              >
                <option value="" className="bg-[#21264C]">
                  + Add to team
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#21264C]">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
