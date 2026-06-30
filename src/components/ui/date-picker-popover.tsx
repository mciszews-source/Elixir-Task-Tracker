"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLabel(iso: string): string {
  if (!iso) return "Set date";
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface DatePickerPopoverProps {
  value: string;
  onChange: (iso: string) => void;
  small?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DatePickerPopover({
  value,
  onChange,
  small,
  className = "",
  disabled,
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [coord, setCoord] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const v = value || todayISO();
  const initial = parseISO(v);
  const [calYear, setCalYear] = useState(initial.getFullYear());
  const [calMonth, setCalMonth] = useState(initial.getMonth());
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // When opening, sync to the currently selected value.
  useEffect(() => {
    if (open) {
      const d = parseISO(value || todayISO());
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    }
  }, [open, value]);

  // Outside-click + Escape close.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (popRef.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Position the portal under the trigger.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const ph = 332;
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const top = spaceBelow > ph ? r.bottom + 8 : r.top - ph - 8;
    let left = r.left;
    if (left + 280 > window.innerWidth - 8) left = window.innerWidth - 288;
    if (left < 8) left = 8;
    setCoord({ top, left });
  }, [open]);

  function nav(dir: -1 | 1) {
    let m = calMonth + dir;
    let y = calYear;
    if (m > 11) {
      m = 0;
      y++;
    } else if (m < 0) {
      m = 11;
      y--;
    }
    setCalMonth(m);
    setCalYear(y);
  }

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  const sel = value ? parseISO(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const dim = new Date(calYear, calMonth + 1, 0).getDate();

  const days: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`e-${i}`} className="aspect-square" />);
  }
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(calYear, calMonth, d);
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = isSameDay(dt, today);
    const isSel = sel && isSameDay(dt, sel);
    const isPast = dt < today;
    days.push(
      <button
        key={d}
        type="button"
        onClick={() => pick(iso)}
        className={[
          "aspect-square rounded-lg text-[13px] transition",
          "flex items-center justify-center",
          isSel
            ? "bg-[rgba(74,120,196,0.7)] font-bold text-white ring-1 ring-[rgba(154,188,240,0.9)]"
            : isToday
              ? "font-semibold text-white ring-1 ring-white/40"
              : isPast
                ? "text-white/25 hover:bg-white/[0.13] hover:text-white"
                : "text-white/75 hover:bg-white/[0.13] hover:text-white",
        ].join(" ")}
      >
        {d}
      </button>,
    );
  }

  const sizeCls = small
    ? "text-[12px] px-3 py-[7px] rounded-[8px] min-w-[110px]"
    : "text-[13px] px-3.5 py-[10px] rounded-[10px] min-w-[128px]";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Pick date"
        className={[
          "glass-input flex items-center gap-2 whitespace-nowrap font-medium text-white outline-none transition",
          sizeCls,
          open && "border-white/50 bg-white/[0.18]",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="text-[14px] opacity-55">📅</span>
        <span>{formatLabel(value || todayISO())}</span>
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            className="elixir-popover fixed z-[99999] w-[280px] p-[18px]"
            style={{ top: coord.top, left: coord.left }}
            role="dialog"
            aria-label="Date picker"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => nav(-1)}
                aria-label="Previous month"
                className="rounded-md px-2.5 py-0.5 text-[20px] leading-none text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                ‹
              </button>
              <span className="font-display text-[13px] font-semibold tracking-[0.12em] text-white">
                {MONTHS[calMonth]} {calYear}
              </span>
              <button
                type="button"
                onClick={() => nav(1)}
                aria-label="Next month"
                className="rounded-md px-2.5 py-0.5 text-[20px] leading-none text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-[3px]">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="font-display py-[3px] text-center text-[9px] font-bold tracking-[0.1em] text-white/30"
                >
                  {w}
                </div>
              ))}
              {days}
            </div>

            <button
              type="button"
              onClick={() => pick(todayISO())}
              className="font-display mt-3 w-full rounded-[9px] border border-white/15 bg-white/[0.07] py-[9px] text-[10px] font-bold tracking-[0.16em] text-white/60 transition hover:bg-white/[0.15] hover:text-white"
            >
              TODAY
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
