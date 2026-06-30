import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { getSessionContext } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!canManageUsers(session.role)) redirect("/");

  return <AdminUsersClient />;
}
