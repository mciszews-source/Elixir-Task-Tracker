import { format } from "date-fns";
import { DailyReport } from "@/components/reports/daily-report";
import { NextDayPreview } from "@/components/reports/next-day-preview";
import { TopBar } from "@/components/layout/top-bar";
import { MOCK_COMPLETED_TODAY, MOCK_TOP_TOMORROW } from "@/lib/mock-data";

export default function DailyReportPage() {
  const today = format(new Date(), "MMMM d, yyyy");
  const tomorrow = format(new Date(Date.now() + 86400000), "MMMM d, yyyy");

  return (
    <>
      <TopBar
        title="Daily report"
        subtitle="Completed work and tomorrow's top priorities"
      />

      <div className="grid flex-1 gap-6 p-8 lg:grid-cols-2">
        <DailyReport tasks={MOCK_COMPLETED_TODAY} dateLabel={today} />
        <NextDayPreview tasks={MOCK_TOP_TOMORROW} dateLabel={tomorrow} />
      </div>
    </>
  );
}
