"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Team, UserRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { NameDialog } from "@/components/ui/name-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TabBarProps {
  activeSlug: string;
  role: UserRole;
}

interface TeamTaskCount extends Team {
  open_count: number;
}

export function TabBar({ activeSlug, role }: TabBarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = role === "admin";

  const { data: teams = [] } = useQuery<TeamTaskCount[]>({
    queryKey: ["teams-with-counts"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      const json = await res.json();
      return (json.data ?? []) as TeamTaskCount[];
    },
  });

  // Pull a quick open-count map (best-effort; doesn't block render).
  const { data: countsMap = {} } = useQuery<Record<string, number>>({
    queryKey: ["team-open-counts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return {};
      const json = await res.json();
      const map: Record<string, number> = {};
      for (const t of json.data?.teams ?? []) {
        map[t.slug] = (t.board_tasks?.length ?? 0) + (t.open_tasks?.length ?? 0);
      }
      return map;
    },
  });

  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Team | null>(null);

  const addTeam = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json.data as Team;
    },
    onSuccess: (team) => {
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teams-with-counts"] });
      queryClient.invalidateQueries({ queryKey: ["team-open-counts"] });
      router.push(`/teams/${team.slug}`);
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/teams/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["teams-with-counts"] });
      queryClient.invalidateQueries({ queryKey: ["team-open-counts"] });
      // Navigate to first remaining team.
      const remaining = teams.filter((t) => t.slug !== pendingDelete?.slug);
      if (remaining[0]) router.push(`/teams/${remaining[0].slug}`);
      else router.push("/projects");
    },
  });

  return (
    <>
      <nav
        className="glass-panel relative z-[15] flex items-center gap-0 overflow-x-auto border-b border-white/10 px-6"
        aria-label="Department tabs"
      >
        {teams.map((team) => {
          const active = team.slug === activeSlug;
          const count = countsMap[team.slug] ?? 0;
          return (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className={cn(
                "font-display group relative flex items-center gap-2 border-b-2 px-6 py-4 text-[12px] font-medium tracking-[0.18em] whitespace-nowrap uppercase transition-all",
                active
                  ? "border-white/85 text-white"
                  : "border-transparent text-white/45 hover:text-white/85",
              )}
            >
              <span>{team.name}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    active ? "bg-white/25 text-white" : "bg-white/15 text-white/75",
                  )}
                >
                  {count}
                </span>
              )}
              {active && isAdmin && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingDelete(team);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPendingDelete(team);
                    }
                  }}
                  title="Delete department"
                  className="ml-1 cursor-pointer rounded-[4px] px-1.5 py-0.5 text-[11px] text-white/40 transition hover:bg-[rgba(232,73,90,0.2)] hover:text-[#FF8F9A]"
                >
                  ✕
                </span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            title="Add department"
            className="font-display ml-1 border-b-2 border-transparent px-4 py-4 text-[18px] leading-none text-white/35 transition hover:bg-white/[0.08] hover:text-white"
          >
            +
          </button>
        )}
      </nav>

      <NameDialog
        open={addOpen}
        title="Add department"
        label="Department name"
        placeholder="e.g. Engineering"
        submitLabel={addTeam.isPending ? "Creating…" : "Create"}
        onCancel={() => setAddOpen(false)}
        onSubmit={(name) => addTeam.mutate(name)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete department?"
        detail={
          pendingDelete
            ? `“${pendingDelete.name}” — all tasks in this department will be removed.`
            : undefined
        }
        confirmLabel={deleteTeam.isPending ? "Deleting…" : "Delete"}
        variant="danger"
        icon="🗑"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() =>
          pendingDelete && deleteTeam.mutate(pendingDelete.slug)
        }
      />
    </>
  );
}
