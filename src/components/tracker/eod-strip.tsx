"use client";

import { useState } from "react";
import type { TaskWithRelations } from "@/types/database";
import { priorityLabels } from "@/lib/brand";
import { formatDueDate } from "@/lib/utils";

interface EodStripProps {
  teamName: string;
  tasks: TaskWithRelations[];
}

export function EodStrip({ teamName, tasks }: EodStripProps) {
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = tasks.filter((t) => t.status !== "done");
  const top = active.filter((t) => t.priority === "critical" || t.priority === "high");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function buildBriefText() {
    let txt = `EOD BRIEF — ${teamName.toUpperCase()} · ${today}\n${"─".repeat(52)}\n\nTOP PRIORITIES FOR TOMORROW:\n\n`;
    if (top.length) {
      top.forEach((t, i) => {
        const od = t.due_date && t.due_date < new Date().toISOString().slice(0, 10);
        txt += `${i + 1}. [${priorityLabels[t.priority].toUpperCase()}] ${t.title}\n`;
        if (t.due_date) txt += `   Due: ${formatDueDate(t.due_date)}${od ? " ⚠ OVERDUE" : ""}\n`;
        if (t.description) txt += `   Risk: ${t.description}\n`;
        if (t.is_executive_request) txt += `   ★ Ewan's request\n`;
        txt += "\n";
      });
    } else {
      txt += "No critical or high priority tasks.\n\n";
    }
    txt += `ALL ACTIVE TASKS (${active.length} total):\n`;
    active.forEach((t, i) => {
      txt += `${i + 1}. ${t.title} [${priorityLabels[t.priority]}]\n`;
    });
    return txt;
  }

  async function copyBrief() {
    await navigator.clipboard.writeText(buildBriefText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-7">
      <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-5 py-4">
        <span className="font-display text-[11px] tracking-[0.2em] text-white/45 uppercase">
          End-of-day brief · share with Ewan before close of business
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="elixir-btn"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={copyBrief}
            className="elixir-btn elixir-btn-primary"
          >
            {copied ? "✓ Copied" : "Copy Brief"}
          </button>
        </div>
      </div>

      {preview && (
        <div className="glass-panel-deep mt-3 rounded-xl px-5 py-4 text-sm leading-7 text-white/60">
          <p className="mb-3 font-display text-[11px] tracking-[0.2em] text-white/85 uppercase">
            EOD BRIEF — {teamName.toUpperCase()}
          </p>
          <p className="mb-3 font-display text-[10px] tracking-[0.18em] text-white/45 uppercase">
            Top priorities for tomorrow
          </p>
          {top.length ? (
            <ul className="space-y-1.5">
              {top.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 text-[13px]"
                >
                  <span
                    className={`font-display priority-${t.priority} rounded-full px-2 py-[2px] text-[9px] font-bold tracking-[0.1em] uppercase`}
                  >
                    {priorityLabels[t.priority]}
                  </span>
                  <span className="text-white/85">{t.title}</span>
                  {t.due_date && (
                    <span className="font-display ml-auto text-[12px] tracking-wide text-white/40">
                      {formatDueDate(t.due_date)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/35">No critical or high-priority tasks.</p>
          )}
        </div>
      )}
    </div>
  );
}
