import { NextResponse } from "next/server";
import { MOCK_DASHBOARD } from "@/lib/mock-data";

export async function GET() {
  // TODO: Replace with Supabase query when connected
  return NextResponse.json({
    data: {
      teams: MOCK_DASHBOARD,
      generated_at: new Date().toISOString(),
    },
  });
}
