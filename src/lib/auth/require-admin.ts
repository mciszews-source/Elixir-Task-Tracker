import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions";

export async function requireAdmin() {
  const session = await getSessionContext();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isAdminRole(session.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
