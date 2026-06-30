import { NextResponse } from "next/server";
import { MOCK_COMPLETED_TODAY, MOCK_TOP_TOMORROW } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  // TODO: Query tasks where completed_at in date window (America/New_York)
  // TODO: Top tomorrow = is_on_board tasks ordered by sort_order, status != done

  return NextResponse.json({
    data: {
      date,
      timezone: process.env.NEXT_PUBLIC_TIMEZONE ?? "America/New_York",
      completed_today: MOCK_COMPLETED_TODAY,
      top_tomorrow: MOCK_TOP_TOMORROW,
    },
  });
}
