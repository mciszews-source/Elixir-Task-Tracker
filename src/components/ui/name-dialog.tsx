"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface NameDialogProps {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function NameDialog({
  open,
  title,
  label = "Name",
  placeholder = "",
  initialValue = "",
  submitLabel = "Create",
  onSubmit,
  onCancel,
}: NameDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof window === "undefined") return null;

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-[999998] flex items-center justify-center bg-[rgba(10,14,40,0.75)] backdrop-blur-md"
    >
      <div
        className="elixir-popover w-[400px] max-w-[90vw] p-8"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-display text-center text-[16px] font-semibold tracking-[0.08em] text-white">
          {title}
        </h3>
        <label className="font-display mt-5 block text-[10px] font-bold tracking-[0.2em] text-white/55 uppercase">
          {label}
        </label>
        <input
          ref={inputRef}
          type="text"
          className="glass-input mt-2 w-full rounded-[10px] px-4 py-[11px] text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} className="elixir-btn">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            className="elixir-btn elixir-btn-primary"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
