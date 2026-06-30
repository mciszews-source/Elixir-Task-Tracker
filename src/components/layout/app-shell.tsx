import { Sidebar } from "@/components/layout/sidebar";
import { ElixirHeader } from "@/components/layout/elixir-header";
import type { UserRole } from "@/types/database";

interface AppShellProps {
  children: React.ReactNode;
  role?: UserRole;
  userName?: string;
  headerView?: "departments" | "projects";
}

export function AppShell({
  children,
  role,
  userName,
  headerView = "departments",
}: AppShellProps) {
  return (
    <div className="relative z-10 flex min-h-screen">
      <Sidebar role={role} userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ElixirHeader view={headerView} />
        <main className="relative z-10 flex-1 overflow-y-auto px-8 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
