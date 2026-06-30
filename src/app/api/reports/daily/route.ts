import { NextResponse } from "next/server";
import { fetchDailyReport } from "@/lib/queries/dashboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const data = await fetchDailyReport(date);
  return NextResponse.json({ data });
}
